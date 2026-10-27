import { NextResponse } from "next/server";
import { handleMidtransRequest } from "@/lib/midtrans/notification-processor";

/**
 * URL asinkron yang didaftarkan di Midtrans Dashboard → Web Settings →
 * Notification Redirect URL:
 *   https://haji-silk.vercel.app/api/midtrans/webhook
 *
 * /api/midtrans/notification adalah alias dengan handler yang sama, supaya
 * notifikasi tetap masuk walaupun URL lama masih terpasang di dashboard.
 */
export async function POST(req: Request) {
  const result = await handleMidtransRequest(req, "midtrans:webhook");
  return NextResponse.json(result.body, { status: result.httpStatus });
}
