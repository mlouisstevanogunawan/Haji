import type { Metadata } from "next";
import { PaymentResultView } from "@/components/payment/PaymentResultView";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil | Al-Madinah Tour & Travel",
};

export default function PembayaranSuksesPage() {
  return <PaymentResultView kind="success" />;
}
