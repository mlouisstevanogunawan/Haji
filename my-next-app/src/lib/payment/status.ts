import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceNumberFromOrderId, applyMidtransStatus } from "@/lib/midtrans/notification-processor";
import { getMidtransTransactionStatus } from "@/lib/midtrans/server";

export type PaymentStatus = {
  order_id: string;
  invoice_found: boolean;
  invoice_id: string | null;
  invoice_number: string | null;
  booking_id: string | null;
  status: string | null;
  amount: number;
  paid_amount: number;
  remaining: number;
  payment_method: string | null;
  payment_date: string | null;
  midtrans_order_id: string | null;
  midtrans_transaction_id: string | null;
  gateway_records: Array<{
    transaction_id: string | null;
    order_id: string;
    transaction_status: string;
    fraud_status: string | null;
    gross_amount: number;
    created_at: string;
  }>;
};

/**
 * Baca kondisi tagihan + jejak gateway untuk satu order_id.
 * Memakai service role, jadi hanya boleh dipanggil dari sisi server setelah
 * pemanggilnya terbukti punya sesi login.
 */
export async function getPaymentStatusByOrderId(orderId: string): Promise<PaymentStatus> {
  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, booking_id, status, amount, paid_amount, payment_method, payment_date, midtrans_order_id, midtrans_transaction_id"
    )
    .or(
      `midtrans_order_id.eq.${orderId},invoice_number.eq.${invoiceNumberFromOrderId(orderId)}`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal membaca tagihan: ${error.message}`);
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "transaction_id, order_id, transaction_status, fraud_status, gross_amount, created_at"
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (paymentsError) {
    console.warn(`[payment:status] gagal membaca payments untuk ${orderId}:`, paymentsError.message);
  }

  const total = Math.max(0, Math.round(Number(invoice?.amount || 0)));
  const paid = Math.max(0, Math.round(Number(invoice?.paid_amount || 0)));

  return {
    order_id: orderId,
    invoice_found: Boolean(invoice),
    invoice_id: invoice?.id ?? null,
    invoice_number: invoice?.invoice_number ?? null,
    booking_id: invoice?.booking_id ?? null,
    status: invoice?.status ?? null,
    amount: total,
    paid_amount: paid,
    remaining: Math.max(0, total - paid),
    payment_method: invoice?.payment_method ?? null,
    payment_date: invoice?.payment_date ?? null,
    midtrans_order_id: invoice?.midtrans_order_id ?? null,
    midtrans_transaction_id: invoice?.midtrans_transaction_id ?? null,
    gateway_records: payments ?? [],
  };
}

/** Penjelasan singkat untuk frontend, diambil dari jawaban Midtrans (bukan URL). */
export function gatewayMessage(
  transactionStatus: string,
  fraudStatus?: string | null
): string {
  if (transactionStatus === "settlement") return "Dana sudah masuk (settlement) dan tagihan diperbarui.";
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") return "Pembayaran kartu diterima dan tagihan diperbarui.";
    if (fraudStatus === "challenge")
      return "Transaksi kartu sedang ditinjau fraud Midtrans; belum dihitung sebagai pembayaran.";
    return "Transaksi kartu ditolak (deny).";
  }
  if (transactionStatus === "pending")
    return "Midtrans masih menunggu pembayaran pada channel yang dipilih.";
  if (transactionStatus === "expire") return "Batas waktu transaksi habis di Midtrans.";
  if (transactionStatus === "cancel") return "Transaksi dibatalkan pada Midtrans.";
  if (transactionStatus === "deny") return "Transaksi ditolak oleh Midtrans/channel.";
  if (transactionStatus === "authorize") return "Kartu diotorisasi, tapi belum di-capture.";
  return `Status Midtrans: ${transactionStatus}.`;
}

export type SyncResult = { httpStatus: number; body: Record<string, unknown> };

/**
 * Frontend-triggered status check: tanyakan transaksi ke Midtrans memakai
 * MIDTRANS_SERVER_KEY, lalu tulis hasilnya ke database bila uangnya benar-benar
 * masuk. Tidak bergantung pada Notification URL di dashboard Midtrans.
 *
 * Query string dari halaman redirect hanya dipakai sebagai HINT order_id;
 * angka yang ditulis selalu berasal dari jawaban Midtrans dan dihitung ulang
 * oleh gerbang idempoten yang sama dengan webhook, sehingga keduanya tidak
 * pernah menghitung pembayaran dua kali.
 */
export async function syncPaymentStatus(
  orderId: string,
  transactionHint?: string | null
): Promise<SyncResult> {
  const before = await getPaymentStatusByOrderId(orderId);

  const fetched = await getMidtransTransactionStatus(
    orderId,
    transactionHint?.trim() || before.midtrans_transaction_id
  );

  if (!fetched.ok) {
    return {
      httpStatus: fetched.httpStatus,
      body: {
        verified: false,
        order_id: orderId,
        error_code: fetched.code,
        message: fetched.message,
        invoice: before,
      },
    };
  }

  const gateway = fetched.status;
  const applied = await applyMidtransStatus(gateway, "payment:verify");
  const after = await getPaymentStatusByOrderId(orderId);

  return {
    httpStatus: applied.httpStatus === 500 ? 502 : 200,
    body: {
      verified: applied.httpStatus !== 500,
      order_id: orderId,
      endpoint: fetched.endpoint,
      gateway: {
        transaction_status: gateway.transaction_status,
        fraud_status: gateway.fraud_status ?? null,
        payment_type: gateway.payment_type,
        gross_amount: gateway.gross_amount,
        settlement_time: gateway.settlement_time ?? null,
      },
      message: gatewayMessage(gateway.transaction_status, gateway.fraud_status ?? null),
      applied: applied.body,
      invoice: after,
    },
  };
}
