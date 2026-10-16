import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = {
  title: "Pembayaran Gagal | Al-Madinah Tour & Travel",
};

export default function PembayaranGagalPage() {
  return <PaymentResultView kind="error" />;
}
