import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";
import { pickCallbackParam } from "@/lib/payment/result-params";

export const metadata: Metadata = {
  title: "Pembayaran Gagal | Al-Madinah Tour & Travel",
};

export default function PembayaranGagalPage({
  searchParams,
}: {
  searchParams: { order_id?: string | string[]; transaction_id?: string | string[] };
}) {
  return (
    <PaymentResultView
      kind="error"
      orderId={pickCallbackParam(searchParams.order_id)}
      transactionId={pickCallbackParam(searchParams.transaction_id)}
    />
  );
}
