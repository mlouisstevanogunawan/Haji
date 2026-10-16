import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransNotificationSignature, getMidtransConfig } from "@/lib/midtrans/server";
import { getMidtransAmount } from "@/lib/midtrans/config";
import { MidtransNotificationPayload, InvoiceStatus } from "@/lib/midtrans/types";
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

    let finalInvoiceStatus: InvoiceStatus = invoiceStatus;

    // 3. Update Status di Supabase (invoices & payments table)
    //    Pembayaran dicatat secara inkremental: nominal yang benar-benar dibayar
    //    (sudah dinormalisasi via getMidtransAmount untuk sandbox) DIJUMLAHKAN ke
    //    paid_amount yang sudah ada, lalu status dihitung ulang dari sisa tagihan.
    try {
      const supabase = createClient();
      const rawInvoiceNum = order_id.split("-TX")[0].split("-timestamp-")[0];

      // Ambil invoice terkait sebelum update agar bisa mengakumulasi paid_amount
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, amount, paid_amount, status")
        .or(`invoice_number.eq.${rawInvoiceNum},midtrans_order_id.eq.${order_id}`)
        .maybeSingle();

      let updatedInvoiceId: string | null = invoice?.id ?? null;

      // Dedup lintas-jalur: lewati akumulasi bila order_id ini sudah pernah
      // dicatat (mis. oleh client callback) ATAU transaction_id settlement/capture
      // yang sama sudah pernah masuk (Midtrans dapat mengirim ulang notifikasi).
      let existingPayment: { id: string } | null = null;
      if (isPaid) {
        const { data: byOrder } = await supabase
          .from("payments")
          .select("id")
          .eq("order_id", order_id)
          .in("transaction_status", ["settlement", "capture"])
          .maybeSingle();
        existingPayment = byOrder;

        if (!existingPayment && transaction_id) {
          const { data: byTxn } = await supabase
            .from("payments")
            .select("id")
            .eq("transaction_id", transaction_id)
            .in("transaction_status", ["settlement", "capture"])
            .maybeSingle();
          existingPayment = byTxn;
        }
      }
      const alreadyApplied = Boolean(existingPayment);

      if (invoice && alreadyApplied) {
        finalInvoiceStatus = invoice.status;
        updatedInvoiceId = invoice.id;
      } else if (invoice) {
        // Hanya tambah paid_amount untuk transaksi yang benar-benar lunas/di-settle.
        if (isPaid) {
          // nominal yang dikirim ke Midtrans (sudah dipotong saat sandbox)
          const nominalDibayar = getMidtransAmount(Number(gross_amount) || 0);
          const newPaid = Number(invoice.paid_amount || 0) + nominalDibayar;
          const totalTagihan = Number(invoice.amount || 0);
          const sisaTagihan = totalTagihan - newPaid;

          finalInvoiceStatus = sisaTagihan <= 0 ? "paid" : "partial";

          const { data: updated } = await supabase
            .from("invoices")
            .update({
              paid_amount: newPaid,
              status: finalInvoiceStatus,
              midtrans_transaction_id: transaction_id,
              midtrans_order_id: order_id,
              payment_method: payment_type,
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id)
            .select("id")
            .maybeSingle();

          updatedInvoiceId = updated?.id ?? updatedInvoiceId;
        } else {
          // pending / expire / cancel / deny: jangan sentuh paid_amount,
          // hanya sinkronkan status & reference transaksi.
          const { data: updated } = await supabase
            .from("invoices")
            .update({
              status: invoiceStatus,
              midtrans_transaction_id: transaction_id,
              midtrans_order_id: order_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id)
            .select("id")
            .maybeSingle();

          updatedInvoiceId = updated?.id ?? updatedInvoiceId;
        }
      }

      // Insert record to payments audit log (lewati bila sudah pernah dicatat)
      if (!alreadyApplied) {
        await supabase.from("payments").insert({
          invoice_id: updatedInvoiceId,
          order_id,
          transaction_id,
          payment_type: payment_type || "unknown",
          gross_amount: Number(gross_amount) || 0,
          transaction_status,
          fraud_status: fraud_status || null,
          settlement_time: isPaid ? new Date().toISOString() : null,
          raw_response: payload,
        });
      }
    } catch (dbError) {
      console.warn("[Midtrans Webhook] Database update notice:", dbError);
    }

    return NextResponse.json({
      status: "success",
      message: `Transaction ${order_id} processed as ${finalInvoiceStatus}`,
      order_id,
      transaction_status,
      invoice_status: finalInvoiceStatus,
    });
  } catch (error: any) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process notification" },
      { status: 500 }
    );
  }
}
