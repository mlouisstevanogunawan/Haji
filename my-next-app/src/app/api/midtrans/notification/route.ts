import { NextResponse } from "next/server";
import { handleMidtransRequest } from "@/lib/midtrans/notification-processor";

/**
 * Alias lama. Notifikasi Midtrans yang masih dikirim ke URL ini diproses
 * dengan logika yang sama persis seperti /api/midtrans/webhook.
 */
export async function POST(req: Request) {
  const result = await handleMidtransRequest(req, "midtrans:notification");
  return NextResponse.json(result.body, { status: result.httpStatus });
}
