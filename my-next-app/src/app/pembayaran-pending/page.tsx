import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = {
  title: "Pembayaran Tertunda | Al-Madinah Tour & Travel",
};

export default function PembayaranPendingPage() {
  return <PaymentResultView kind="pending" />;
}
