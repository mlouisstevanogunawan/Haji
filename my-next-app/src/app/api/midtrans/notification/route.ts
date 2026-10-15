import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransNotificationSignature, getMidtransConfig } from "@/lib/midtrans/server";
import { MidtransNotificationPayload } from "@/lib/midtrans/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MidtransNotificationPayload;

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = payload;

    const { serverKey } = getMidtransConfig();
    const isDummyKey = !serverKey || serverKey.includes("dummy") || serverKey.includes("xxxxx");

    // 1. Validasi Webhook Signature SHA-512
    if (!isDummyKey && signature_key) {
      const isValid = verifyMidtransNotificationSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      );

      if (!isValid) {
        console.warn(`[Midtrans Webhook] Invalid signature key for order ${order_id}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    // 2. Mapping Status Midtrans ke Status Invoice
    let invoiceStatus: "unpaid" | "partial" | "paid" | "expired" | "cancelled" = "unpaid";
    let isPaid = false;

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        invoiceStatus = "unpaid";
      } else if (fraud_status === "accept") {
        invoiceStatus = "paid";
        isPaid = true;
      }
    } else if (transaction_status === "settlement") {
      invoiceStatus = "paid";
      isPaid = true;
    } else if (transaction_status === "pending") {
      invoiceStatus = "unpaid";
    } else if (transaction_status === "expire") {
      invoiceStatus = "expired";
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      invoiceStatus = "cancelled";
    }

    console.log(
      `[Midtrans Webhook] Order: ${order_id}, Status: ${transaction_status}, Result: ${invoiceStatus}`
    );

    // 3. Update Status di Supabase (invoices & payments table)
    try {
      const supabase = createClient();
      const rawInvoiceNum = order_id.split("-TX")[0].split("-timestamp-")[0];

      // Update invoices table
      const { data: updatedInvoice } = await supabase
        .from("invoices")
        .update({
          status: invoiceStatus,
          midtrans_transaction_id: transaction_id,
          midtrans_order_id: order_id,
          payment_method: payment_type,
          payment_date: isPaid ? new Date().toISOString() : null,
          paid_amount: isPaid ? Number(gross_amount) : 0,
          updated_at: new Date().toISOString(),
        })
        .or(`invoice_number.eq.${rawInvoiceNum},midtrans_order_id.eq.${order_id}`)
        .select("id")
        .maybeSingle();

      // Insert record to payments audit log
      await supabase.from("payments").insert({
        invoice_id: updatedInvoice?.id || null,
        order_id,
        transaction_id,
        payment_type: payment_type || "unknown",
        gross_amount: Number(gross_amount) || 0,
        transaction_status,
        fraud_status: fraud_status || null,
        settlement_time: isPaid ? new Date().toISOString() : null,
        raw_response: payload,
      });
    } catch (dbError) {
      console.warn("[Midtrans Webhook] Database update notice:", dbError);
    }

    return NextResponse.json({
      status: "success",
      message: `Transaction ${order_id} processed as ${invoiceStatus}`,
      order_id,
      transaction_status,
      invoice_status: invoiceStatus,
    });
  } catch (error: any) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process notification" },
      { status: 500 }
    );
  }
}
