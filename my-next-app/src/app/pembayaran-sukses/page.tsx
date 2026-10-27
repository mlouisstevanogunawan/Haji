import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil | Al-Madinah Tour & Travel",
};

export default function PembayaranSuksesPage({
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

  return <PaymentResultView kind="success" orderId={orderId} />;
}
