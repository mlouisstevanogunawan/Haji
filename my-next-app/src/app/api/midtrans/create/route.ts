import { NextRequest, NextResponse } from "next/server";
import { createSnapTransaction } from "@/lib/midtrans/server";
import { MidtransSnapRequest } from "@/lib/midtrans/types";
import { getMidtransAmount, buildSnapCallbacks } from "@/lib/midtrans/config";
import { requireSession } from "@/lib/api/session";

export async function POST(req: NextRequest) {
  try {
    // Transaksi hanya dibuat atas nama sesi login; webhook Midtrans tetap publik
    // karena diverifikasi lewat signature server-to-server.
    if (!(await requireSession(req))) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      order_id,
      gross_amount,
      customer_details,
      item_details,
      payment_channel,
    } = body;

    if (!order_id || !gross_amount) {
      return NextResponse.json(
        { error: "order_id dan gross_amount wajib diisi." },
        { status: 400 }
      );
    }

    // Tentukan payment channel yang diaktifkan (opsional)
    let enabled_payments: string[] | undefined = undefined;
    if (payment_channel) {
      switch (payment_channel) {
        case "dana":
          enabled_payments = ["dana", "gopay", "shopeepay", "other_qris"];
          break;
        case "gopay":
          enabled_payments = ["gopay", "other_qris"];
          break;
        case "shopeepay":
          enabled_payments = ["shopeepay", "other_qris"];
          break;
        case "bca_va":
          enabled_payments = ["bca_va", "other_va"];
          break;
        case "mandiri_bill":
          enabled_payments = ["echannel", "mandiri_clickpay"];
          break;
        case "bni_va":
          enabled_payments = ["bni_va", "other_va"];
          break;
        case "bri_va":
          enabled_payments = ["bri_va", "other_va"];
          break;
        case "qris":
          enabled_payments = ["other_qris", "gopay", "shopeepay"];
          break;
        default:
          enabled_payments = undefined;
      }
    }

    // In sandbox mode, cap the charge to a safe test nominal so no payment
    // channel rejects with "Exceeds max. transaction amount".
    const sanitizedAmount = getMidtransAmount(gross_amount);

    let sanitizedItems = item_details?.map((it: any) => ({
      id: String(it.id || order_id).slice(0, 50),
      price: getMidtransAmount(it.price),
      quantity: Math.max(1, Math.round(Number(it.quantity || 1))),
      name: String(it.name || "Tagihan Paket").slice(0, 50).trim(),
    }));

    const itemsTotal = sanitizedItems?.reduce(
      (acc: number, it: any) => acc + it.price * it.quantity,
      0
    );

    if (!sanitizedItems || itemsTotal !== sanitizedAmount) {
      const fallbackName = String(
        customer_details?.packageName || "Tagihan Ibadah Umroh / Haji"
      )
        .slice(0, 50)
        .trim();

      sanitizedItems = [
        {
          id: String(order_id).slice(0, 50),
          price: sanitizedAmount,
          quantity: 1,
          name: fallbackName,
        },
      ];
    }

    const payload: MidtransSnapRequest = {
      transaction_details: {
        order_id: String(order_id),
        gross_amount: sanitizedAmount,
      },
      customer_details: {
        first_name: customer_details?.name || "Jamaah",
        email: customer_details?.email || "jamaah@almadinahtour.com",
        phone: customer_details?.phone || "08123456789",
      },
      item_details: sanitizedItems,
      enabled_payments,
      callbacks: buildSnapCallbacks(),
    };

    const snapResult = await createSnapTransaction(payload);

    return NextResponse.json({
      success: true,
      token: snapResult.token,
      redirect_url: snapResult.redirect_url,
      order_id: payload.transaction_details.order_id,
      gross_amount: payload.transaction_details.gross_amount,
    });
  } catch (error: any) {
    console.error("Error creating Midtrans transaction:", error);
    return NextResponse.json(
      {
        error: error.message || "Gagal membuat transaksi Midtrans Snap",
      },
      { status: 500 }
    );
  }
}
