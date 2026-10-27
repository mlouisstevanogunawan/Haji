import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";
import { pickCallbackParam } from "@/lib/payment/result-params";

export const metadata: Metadata = {
  title: "Pembayaran Tertunda | Al-Madinah Tour & Travel",
};

export default function PembayaranPendingPage({
  searchParams,
}: {
  searchParams: { order_id?: string | string[]; transaction_id?: string | string[] };
}) {
  return (
    <PaymentResultView
      kind="pending"
      orderId={pickCallbackParam(searchParams.order_id)}
      transactionId={pickCallbackParam(searchParams.transaction_id)}
    />
  );
}
