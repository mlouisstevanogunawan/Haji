"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Building,
  Menu as MenuIcon,
  FileText,
} from "lucide-react";
import { getInvoices, type InvoiceWithDetails } from "@/services/invoiceService";
import { PaymentModal, PaymentInvoiceData } from "@/components/payment/PaymentModal";

interface SubTagihanItem {
  id: string;
  code: string;
  type: "Uang Muka (DP)" | "Cicilan";
  status: "Lunas" | "Belum Bayar";
  amount: number;
  paidAmount: number;
  dueDate: string;
}

export default function DetailTagihanJamaahPage() {
  const params = useParams();
  const rawId = ((params?.id as string) || (Array.isArray(params?.id) ? params?.id[0] : "")) ?? "";

  const displayCode = rawId || "-";

  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [pilgrimName, setPilgrimName] = React.useState("-");
  const [tagihanList, setTagihanList] = React.useState<SubTagihanItem[]>([]);
  const [matchedInvoices, setMatchedInvoices] = React.useState<InvoiceWithDetails[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentInvoiceData | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    if (!rawId) {
      setNotFound(true);
      setTagihanList([]);
      setMatchedInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      const invoices = await getInvoices();
      const matching = (invoices || []).filter(
        (inv) =>
          (inv.invoice_number || "").includes(rawId) ||
          inv.booking_id === rawId ||
          inv.id === rawId
      );

      setMatchedInvoices(matching);
      setNotFound(matching.length === 0);

      if (matching.length === 0) {
        setTagihanList([]);
        setPilgrimName("-");
        return;
      }

      const first = matching[0];
      setPilgrimName(first.profiles?.full_name || "-");

      const mapped: SubTagihanItem[] = matching.map((inv) => {
        const total = Number(inv.amount) || 0;
        const paid = Number(inv.paid_amount) || 0;
        let formattedDate = inv.due_date || "-";
        if (inv.due_date) {
          const parsed = new Date(inv.due_date);
          formattedDate = Number.isNaN(parsed.getTime())
            ? inv.due_date
            : parsed.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
        }
        return {
          id: inv.id,
          code: inv.invoice_number || "-",
          type: inv.type === "dp" ? "Uang Muka (DP)" : "Cicilan",
          status: inv.status === "paid" || paid >= total ? "Lunas" : "Belum Bayar",
          amount: total,
          paidAmount: paid,
          dueDate: formattedDate,
        };
      });
      setTagihanList(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat detail tagihan dari Supabase:", err);
      setTagihanList([]);
      setMatchedInvoices([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [rawId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const totalTagihan = tagihanList.reduce((sum, item) => sum + item.amount, 0);
  const totalDibayar = tagihanList.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalSisa = Math.max(0, totalTagihan - totalDibayar);
  const isLunas = totalSisa === 0;

  const handlePay = (item: SubTagihanItem) => {
    const inv = matchedInvoices.find((i) => i.id === item.id);
    setSelectedPayment({
      id: item.id,
      invoiceNumber: item.code,
      pilgrimName: inv?.profiles?.full_name || pilgrimName,
      packageName: inv?.bookings?.packages?.name || "-",
      amount: item.amount - item.paidAmount,
      phone: inv?.profiles?.phone ?? undefined,
      email: inv?.profiles?.email ?? undefined,
    });
    setPaymentModalOpen(true);
  };

  if (!isLoading && notFound) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-xs">
          <h1 className="text-lg font-bold text-gray-900">Data tidak ditemukan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tagihan dengan kode <span className="font-mono">{displayCode}</span> tidak ada di
            Supabase.
            {loadError ? ` Pesan error: ${loadError}` : ""}
          </p>
          <Link
            href="/pembayaran"
            className="inline-block mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-xs"
          >
            Kembali ke Pembayaran
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <Link href="/pembayaran" className="hover:text-gray-900 transition">
              Pembayaran
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{displayCode}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Tagihan: {pilgrimName}</h1>
          <p className="text-sm text-gray-500">{displayCode}</p>
        </div>

        {/* Action Button Right */}
        <div>
          <Link
            href="/pendaftaran"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm px-4 py-2 rounded-lg transition shadow-xs"
          >
            <FileText className="h-4 w-4 text-gray-500" />
            <span>Detail Pendaftaran</span>
          </Link>
        </div>
      </div>

      {/* 3 Stat Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Tagihan */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Tagihan</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Card 2: Sudah Dibayar */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Sudah Dibayar</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
              Rp {totalDibayar.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Card 3: Sisa */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <MenuIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Sisa</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
              Rp {totalSisa.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isLunas ? "Lunas" : "Belum Lunas"}
            </p>
          </div>
        </div>
      </div>

      {/* Card Daftar Tagihan matching Screenshot 2 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Daftar Tagihan</h2>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Memuat data tagihan dari Supabase...
            </p>
          ) : tagihanList.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {loadError
                ? `Gagal memuat data tagihan dari Supabase: ${loadError}`
                : "Belum ada tagihan tersimpan di Supabase untuk kode ini."}
            </p>
          ) : (
            tagihanList.map((item) => {
            const sisaItem = Math.max(0, item.amount - item.paidAmount);
            return (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                {/* Left info */}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.code}</span>
                    {/* Badge Jenis */}
                    {item.type === "Uang Muka (DP)" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Uang Muka (DP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Cicilan
                      </span>
                    )}

                    {/* Badge Status */}
                    {item.status === "Lunas" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Belum Bayar
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1.5">
                    Tagihan Rp {item.amount.toLocaleString("id-ID")} • Dibayar Rp{" "}
                    {item.paidAmount.toLocaleString("id-ID")} • Sisa Rp{" "}
                    {sisaItem.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Right info */}
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Jatuh tempo: {item.dueDate}
                  </span>

                  {item.status !== "Lunas" && (
                    <button
                      onClick={() => handlePay(item)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-2xs"
                    >
                      Bayar Sekarang
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Payment Modal with Midtrans integration (preserved without altering business logic) */}
      {paymentModalOpen && selectedPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={selectedPayment}
          onPaymentSuccess={() => {
            // Tidak mengubah status di state lokal: angka pembayaran diambil ulang
            // dari Supabase agar yang tampil benar-benar data database.
            void loadData();
          }}
        />
      )}
    </div>
  );
}
