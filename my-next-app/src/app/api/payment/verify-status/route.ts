import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/session";
import { syncPaymentStatus } from "@/lib/payment/status";

/**
 * Frontend-triggered status check — jalur utama tanpa Notification URL Midtrans.
 *
 * Halaman hasil pembayaran (yang hanya boleh dibuka setelah login) mengirim
 * order_id ke sini. Backend menanyakan transaksi itu ke Midtrans memakai
 * MIDTRANS_SERVER_KEY, lalu menulis hasilnya ke database lewat kode yang sama
 * dengan webhook (gerbang idempoten, jadi tidak ada hitung dua kali).
 *
 * Kenapa tidak memakai transaction_status dari query string Midtrans: URL
 * /pembayaran-sukses?transaction_status=settlement boleh diketik siapa saja.
 * Jawaban Midtrans lewat Basic auth server key tidak bisa dipalsukan.
 */
export async function POST(req: NextRequest) {
  if (!(await requireSession(req))) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
  }

  const orderId =
    typeof (body as { order_id?: unknown })?.order_id === "string"
      ? String((body as { order_id: string }).order_id).trim()
      : "";

  if (!orderId || orderId.length > 150) {
    return NextResponse.json(
      { error: "order_id wajib diisi (maks 150 karakter)." },
      { status: 400 }
    );
  }

  const transactionHint =
    typeof (body as { transaction_id?: unknown })?.transaction_id === "string"
      ? String((body as { transaction_id: string }).transaction_id).trim()
      : null;

  try {
    const result = await syncPaymentStatus(orderId, transactionHint);
    return NextResponse.json(result.body, { status: result.httpStatus });
  } catch (err) {
    const message = (err as Error).message || "Unknown error";
    console.error(`[payment:verify] order ${orderId} gagal:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
