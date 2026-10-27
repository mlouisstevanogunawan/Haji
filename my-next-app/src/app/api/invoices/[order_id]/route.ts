import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceNumberFromOrderId } from "@/lib/midtrans/notification-processor";
import { requireSession } from "@/lib/api/session";

type Params = { params: { order_id: string } };

/**
 * Status tagihan authoritative untuk halaman hasil pembayaran.
 *
 * Query string dari Midtrans (transaction_status, status_code, signature_key)
 * TIDAK bisa dipercaya: siapa pun boleh mengetik URL itu di address bar.
 * Halaman sukses karena itu bertanya ke sini, dan angka yang ditampilkan
 * diambil dari baris invoice yang sama dengan yang ditulis webhook.
 *
 * Endpoint ini memakai service role (bypass RLS) jadi pemanggilnya wajib punya
 * sesi login; tanpa itu nomor order mana pun bisa dicoba satu per satu.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const orderId = decodeURIComponent(params.order_id || "");
  if (!orderId) {
    return NextResponse.json({ error: "order_id wajib diisi" }, { status: 400 });
  }

  if (!(await requireSession(req))) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Silakan login untuk melihat status tagihan." },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, amount, paid_amount, payment_method, payment_date")
    .or(`midtrans_order_id.eq.${orderId},invoice_number.eq.${invoiceNumberFromOrderId(orderId)}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[invoices:${orderId}] query gagal:`, error.message);
    return NextResponse.json({ error: "Gagal membaca status" }, { status: 500 });
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("transaction_id, order_id, transaction_status, gross_amount, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const total = Number(invoice?.amount || 0);
  const paid = Math.max(0, Number(invoice?.paid_amount || 0));

  return NextResponse.json({
    order_id: orderId,
    invoice_found: Boolean(invoice),
    invoice_number: invoice?.invoice_number ?? null,
    status: invoice?.status ?? null,
    amount: total,
    paid_amount: paid,
    remaining: Math.max(0, total - paid),
    payment_method: invoice?.payment_method ?? null,
    payment_date: invoice?.payment_date ?? null,
    gateway_records: payments ?? [],
  });
}
