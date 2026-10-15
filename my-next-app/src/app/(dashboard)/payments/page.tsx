"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { InvoiceDetailCard } from "@/components/payment/InvoiceDetailCard";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { AnimatedButton } from "@/components/ui/animated-button";
import { TrustBadge } from "@/components/payment/TrustBadge";

import { getInvoices, InvoiceWithDetails } from "@/services/invoiceService";

export default function PaymentsPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [invoice, setInvoice] = React.useState<{
    invoiceNumber: string;
    pilgrimName: string;
    packageName: string;
    amount: number;
    phone: string;
    email?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadInvoice() {
      try {
        const invoices = await getInvoices();
        if (invoices.length > 0) {
          const inv = invoices[0];
          setInvoice({
            invoiceNumber: inv.invoice_number,
            pilgrimName: inv.profiles?.full_name || "Jamaah",
            packageName: inv.bookings?.packages?.name || "Paket Umroh Reguler",
            amount: Number(inv.amount) - Number(inv.paid_amount || 0),
            phone: inv.profiles?.phone || "-",
            email: inv.profiles?.email || undefined,
          });
        }
      } catch (err) {
        console.error("Gagal memuat invoice dari database:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoice();
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Portal Pembayaran Online
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pelunasan tagihan ibadah resmi terintegrasi Midtrans Snap
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Memuat data tagihan dari Supabase...
          </div>
        ) : invoice ? (
          <>
            <InvoiceDetailCard
              invoiceNumber={invoice.invoiceNumber}
              pilgrimName={invoice.pilgrimName}
              packageName={invoice.packageName}
              amount={invoice.amount}
            />

            <AnimatedButton
              onClick={() => setModalOpen(true)}
              showArrow
            >
              Buka Modal Pembayaran Midtrans Snap
            </AnimatedButton>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada tagihan yang belum dibayar di database.
          </div>
        )}

        <TrustBadge />
      </div>

      {invoice && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          invoice={invoice}
        />
      )}
    </div>
  );
}
