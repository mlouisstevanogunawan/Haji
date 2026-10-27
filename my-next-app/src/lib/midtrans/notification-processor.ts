import { getMidtransConfig, verifyMidtransNotificationSignature } from "@/lib/midtrans/server";
import type { MidtransNotificationPayload } from "@/lib/midtrans/types";
import type { InvoiceStatus } from "@/lib/midtrans/types";
import { createAdminClient } from "@/lib/supabase/admin";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  paid_amount: number | null;
  status: InvoiceStatus;
};

export type NotificationResult = {
  httpStatus: number;
  body: Record<string, unknown>;
};

/** Status Midtrans yang berarti uang benar-benar masuk. */
function isSettled(transactionStatus: string, fraudStatus?: string | null): boolean {
  if (transactionStatus === "settlement") return true;
  if (transactionStatus === "capture") return fraudStatus === "accept";
  return false;
}

/**
 * Status invoice untuk notifikasi yang BUKAN pembayaran berhasil.
 * null = jangan sentuh status. Transaksi expire/cancel/deny hanya membatalkan
 * SATU percobaan bayar, bukan seluruh tagihan: tagihan yang sudah ada
 * pembayaran masuk harus tetap partial/paid.
 */
function failureInvoiceStatus(
  transactionStatus: string,
  alreadyPaid: number
): InvoiceStatus | null {
  if (alreadyPaid > 0) return null;
  if (transactionStatus === "expire") return "expired";
  if (transactionStatus === "cancel" || transactionStatus === "deny") return "cancelled";
  return null;
}

function missingFields(payload: Partial<MidtransNotificationPayload>): string[] {
  const required = ["order_id", "status_code", "gross_amount", "transaction_status"] as const;
  return required.filter((key) => {
    const value = payload[key];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

/**
 * order_id dibuat oleh PaymentModal sebagai `${invoice_number}-TX${6 digit}`,
 * jalur lama memakai `-timestamp-`. Diambil bagian depannya saja untuk mencari invoice.
 */
export function invoiceNumberFromOrderId(orderId: string): string {
  return orderId.split("-TX")[0].split("-timestamp-")[0];
}

/**
 * Proses satu notifikasi Midtrans (server-to-server).
 *
 * Dipakai oleh dua route (/api/midtrans/webhook dan /api/midtrans/notification)
 * supaya URL yang didaftarkan di dashboard Midtrans tidak harus sama persis
 * dengan nama file route-nya.
 *
 * Urutan tulis sengaja: insert jejak pembayaran lebih dulu sebagai gerbang
 * idempoten, baru akumulasi paid_amount. Kalau update gagal, baris yang tadi
 * kita insert dihapus lagi supaya notifikasi ulang dari Midtrans bisa memproses
 * ulang dari awal tanpa menghitung pembayaran dua kali.
 */
export async function processMidtransNotification(
  payload: Partial<MidtransNotificationPayload>,
  logTag: string
): Promise<NotificationResult> {
  const log = (message: string, ...args: unknown[]) => console.log(`[${logTag}] ${message}`, ...args);
  const warn = (message: string, ...args: unknown[]) => console.warn(`[${logTag}] ${message}`, ...args);

  log("Payload diterima:", JSON.stringify(payload));

  const missing = missingFields(payload);
  if (missing.length > 0) {
    warn(`Payload tidak lengkap, kolom kosong: ${missing.join(", ")}`);
    return {
      httpStatus: 400,
      body: { error: "Payload tidak lengkap", missing_fields: missing },
    };
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    payment_type,
    transaction_id,
  } = payload as MidtransNotificationPayload;

  const { serverKey } = getMidtransConfig();
  const isDummyKey = !serverKey || serverKey.includes("dummy") || serverKey.includes("xxxxx");

  if (isDummyKey) {
    warn(
      "MIDTRANS_SERVER_KEY belum terpasang (kosong/dummy). Verifikasi signature DILEWATI. " +
        "Set env var ini pada deployment agar notifikasi palsu tidak bisa ditandai sebagai pembayaran."
    );
  } else if (!signature_key) {
    warn(`Notifikasi tanpa signature_key untuk order ${order_id} — ditolak.`);
    return { httpStatus: 403, body: { error: "signature_key wajib ada" } };
  } else if (
    !verifyMidtransNotificationSignature(order_id, status_code, gross_amount, signature_key)
  ) {
    warn(`Signature tidak cocok untuk order ${order_id} — kemungkinan bukan dari Midtrans.`);
    return { httpStatus: 403, body: { error: "Invalid signature" } };
  }

  const settled = isSettled(transaction_status, fraud_status);
  const nominalDibayar = Math.max(0, Math.round(Number(gross_amount) || 0));

  log(
    `Order ${order_id}: transaction_status=${transaction_status}, fraud_status=${
      fraud_status ?? "-"
    }, payment_type=${payment_type ?? "-"}, verdict=${
      settled ? "BAYAR" : `BUKA-BUKU (${transaction_status})`
    }`
  );

  const supabase = createAdminClient();
  const invoiceNumber = invoiceNumberFromOrderId(order_id);

  const { data: invoice, error: lookupError } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount, paid_amount, status")
    .or(`invoice_number.eq.${invoiceNumber},midtrans_order_id.eq.${order_id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    warn(`Query invoice gagal: ${lookupError.message} (code ${lookupError.code ?? "-"})`);
    return { httpStatus: 500, body: { error: "Gagal membaca invoice", detail: lookupError.message } };
  }

  log(
    invoice
      ? `Invoice ditemukan: ${invoice.invoice_number} (id ${invoice.id}), ` +
          `amount=${invoice.amount}, paid_amount=${invoice.paid_amount}, status=${invoice.status}`
      : `Invoice TIDAK ditemukan. invoice_number dicari="${invoiceNumber}", order_id="${order_id}". ` +
          `Pembayaran ini hanya akan tercatat di tabel payments tanpa menauti tagihan.`
  );

  // Gerbang idempoten: Midtrans mengirim notifikasi lebih dari sekali.
  if (settled) {
    let query = supabase
      .from("payments")
      .select("id, order_id, transaction_status, fraud_status")
      .in("transaction_status", ["settlement", "capture"]);

    query = transaction_id
      ? query.or(`order_id.eq.${order_id},transaction_id.eq.${transaction_id}`)
      : query.eq("order_id", order_id);

    const { data: candidates, error: dedupError } = await query;

    if (dedupError) {
      warn(`Cek duplikat order_id gagal: ${dedupError.message}`);
      return { httpStatus: 500, body: { error: "Gagal cek duplikat pembayaran" } };
    }

    // capture hanya dihitung kalau fraud-nya accept; baris capture+challenge
    // bukan pembayaran dan tidak boleh memblokir settlement berikutnya.
    const existing = (candidates ?? []).find((row) =>
      isSettled(row.transaction_status, row.fraud_status)
    );

    if (existing) {
      log(`Order ${order_id} sudah pernah dicatat (payment ${existing.id}) — tidak dihitung ulang.`);
      return {
        httpStatus: 200,
        body: {
          status: "duplicate",
          order_id,
          invoice_status: invoice?.status ?? "unpaid",
          message: "Pembayaran sudah tercatat, tidak ada perubahan.",
        },
      };
    }
  }

  const previousPaid = Math.max(0, Math.round(Number(invoice?.paid_amount || 0)));
  const targetStatus: InvoiceStatus | null = invoice
    ? settled
      ? previousPaid + nominalDibayar >= Number(invoice.amount || 0)
        ? "paid"
        : "partial"
      : failureInvoiceStatus(transaction_status, previousPaid)
    : null;

  // 1. Jejak pembayaran (menjadi kunci anti duplikat untuk notifikasi berikutnya).
  const { data: paymentRow, error: insertError } = await supabase
    .from("payments")
    .insert({
      invoice_id: invoice?.id ?? null,
      order_id,
      transaction_id: transaction_id ?? null,
      payment_type: payment_type || "unknown",
      gross_amount: nominalDibayar,
      transaction_status,
      fraud_status: fraud_status ?? null,
      settlement_time: settled ? new Date().toISOString() : null,
      raw_response: payload,
    })
    .select("id")
    .single();

  if (insertError) {
    const isDuplicate = insertError.code === "23505";
    warn(
      isDuplicate
        ? `payments.insert ditolak unique index (order ${order_id} sudah tercatat) — anggap duplikat.`
        : `payments.insert GAGAL: ${insertError.message} (code ${insertError.code ?? "-"})`
    );
    return {
      httpStatus: isDuplicate ? 200 : 500,
      body: isDuplicate
        ? { status: "duplicate", order_id, invoice_status: invoice?.status ?? "unpaid" }
        : { error: "Gagal mencatat pembayaran", detail: insertError.message },
    };
  }

  log(`Baris payments tertulis: id=${paymentRow?.id}, invoice_id=${invoice?.id ?? "null"}`);

  // 2. Tagihan: akumulasi nominal yang benar-benar dibayar, lalu hitung ulang status.
  if (!invoice) {
    return {
      httpStatus: 200,
      body: {
        status: "ignored",
        order_id,
        transaction_status,
        invoice_status: "unpaid",
        invoice_found: false,
        message: `Tidak ada invoice dengan nomor ${invoiceNumber}. Cek order_id yang dikirim ke Midtrans.`,
      },
    };
  }

  const updatePayload: Record<string, unknown> = {
    midtrans_order_id: order_id,
    midtrans_transaction_id: transaction_id,
    updated_at: new Date().toISOString(),
  };

  if (settled) {
    updatePayload.paid_amount = previousPaid + nominalDibayar;
    updatePayload.status = targetStatus;
    updatePayload.payment_method = payment_type;
    updatePayload.payment_date = new Date().toISOString();
  } else if (targetStatus) {
    updatePayload.status = targetStatus;
  }

  const { data: updated, error: updateError } = await supabase
    .from("invoices")
    .update(updatePayload)
    .eq("id", invoice.id)
    .select("id, status, paid_amount")
    .maybeSingle();

  if (updateError || !updated) {
    // Batalkan jejak pembayaran supaya notifikasi ulang bisa memproses dari awal.
    const { error: cleanupError } = await supabase.from("payments").delete().eq("id", paymentRow!.id);
    warn(
      `Update invoice ${invoice.id} GAGAL: ${updateError?.message ?? "tidak ada baris yang berubah"}. ` +
        `Jejak pembayaran dihapus kembali${cleanupError ? ` (hapus error: ${cleanupError.message})` : ""}.`
    );
    return {
      httpStatus: 500,
      body: {
        error: "Gagal memperbarui invoice",
        detail: updateError?.message ?? "Invoice tidak berubah setelah update",
      },
    };
  }

  log(
    `Invoice ${updated.id} diperbarui: status=${invoice.status} -> ${updated.status}, ` +
      `paid_amount=${invoice.paid_amount ?? 0} -> ${updated.paid_amount}` +
      (settled ? ` (tagihan ${invoice.amount})` : " (tidak ada uang masuk)")
  );

  return {
    httpStatus: 200,
    body: {
      status: "success",
      order_id,
      transaction_status,
      invoice_id: updated.id,
      invoice_number: invoice.invoice_number,
      invoice_status: updated.status,
      paid_amount: updated.paid_amount,
      amount: invoice.amount,
    },
  };
}

/**
 * Pembaca request + pemrosesan_notifikasi untuk Route Handler.
 * Memisahkan parse body dari logika supaya kedua route bisa satu baris.
 */
export async function handleMidtransRequest(req: Request, logTag: string): Promise<NotificationResult> {
  let payload: Partial<MidtransNotificationPayload>;
  try {
    payload = (await req.json()) as Partial<MidtransNotificationPayload>;
  } catch (err) {
    console.warn(`[${logTag}] Body bukan JSON: ${(err as Error).message}`);
    return { httpStatus: 400, body: { error: "Body bukan JSON yang valid" } };
  }

  try {
    return await processMidtransNotification(payload, logTag);
  } catch (err) {
    const message = (err as Error).message || "Unknown error";
    console.error(`[${logTag}] Error tak terduga:`, err);
    // 500 supaya Midtrans mengirim ulang notifikasinya.
    return { httpStatus: 500, body: { error: "Gagal memproses notifikasi", detail: message } };
  }
}
