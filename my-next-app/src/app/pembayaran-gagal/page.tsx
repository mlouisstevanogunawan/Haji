import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = {
  title: "Pembayaran Gagal | Al-Madinah Tour & Travel",
};

export default function PembayaranGagalPage({
  searchParams,
}: {
  searchParams: { order_id?: string | string[] };
}) {
  const orderId =
    typeof searchParams.order_id === "string"
      ? searchParams.order_id
      : Array.isArray(searchParams.order_id)
      ? searchParams.order_id[0]
      : undefined;

  return <PaymentResultView kind="error" orderId={orderId} />;
}
