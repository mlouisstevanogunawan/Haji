"use client";

import * as React from "react";
import {
  Banknote,
  CheckCircle2,
  X,
  Printer,
  Zap,
} from "lucide-react";
import { BillingStats } from "@/components/billing/BillingStats";
import { BillingFilters } from "@/components/billing/BillingFilters";
import { BillingTable } from "@/components/billing/BillingTable";
import { PaymentModal, PaymentInvoiceData } from "@/components/payment/PaymentModal";
import { IS_PRODUCTION } from "@/lib/midtrans/config";

import {
  getInvoices,
  recordInvoicePayment,
  InvoiceWithDetails,
} from "@/services/invoiceService";

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  typeBadge: "Uang Muka (DP)" | "Cicilan" | "Pelunasan";
  bookingCode: string;
  pilgrimName: string;
  packageName: string;
  phone: string;
  email?: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "Lunas" | "Sebagian" | "Belum Bayar";
}

function mapSupabaseToInvoiceItem(inv: InvoiceWithDetails): InvoiceItem {
  const typeMap: Record<string, "Uang Muka (DP)" | "Cicilan" | "Pelunasan"> = {
    dp: "Uang Muka (DP)",
    cicilan: "Cicilan",
    pelunasan: "Pelunasan",
  };
  const statusMap: Record<string, "Lunas" | "Sebagian" | "Belum Bayar"> = {
    paid: "Lunas",
    partial: "Sebagian",
    unpaid: "Belum Bayar",
    expired: "Belum Bayar",
    cancelled: "Belum Bayar",
  };

  const total = Number(inv.amount) || 0;
  const paid = Number(inv.paid_amount) || 0;
  const remaining = Math.max(0, total - paid);

  let formattedDate = inv.due_date;
  try {
    formattedDate = new Date(inv.due_date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {}

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    typeBadge: typeMap[inv.type] || "Uang Muka (DP)",
    bookingCode: inv.booking_id ? `REG-${inv.booking_id.slice(0, 6).toUpperCase()}` : "REG-000000",
    pilgrimName: inv.profiles?.full_name || "Jamaah",
    packageName: inv.bookings?.packages?.name || "Paket Umroh",
    phone: inv.profiles?.phone || "-",
    email: inv.profiles?.email || undefined,
    dueDate: formattedDate,
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: remaining,
    status: statusMap[inv.status] || (remaining === 0 ? "Lunas" : paid > 0 ? "Sebagian" : "Belum Bayar"),
  };
}

export default function TagihanKasirPage() {
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("Semua");
  const [typeFilter, setTypeFilter] = React.useState<string>("Semua");

  // Midtrans Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = React.useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    React.useState<PaymentInvoiceData | null>(null);

  // Cashier manual record modal
  const [cashierModalOpen, setCashierModalOpen] = React.useState<boolean>(false);
  const [selectedInvoiceForCashier, setSelectedInvoiceForCashier] =
    React.useState<InvoiceItem | null>(null);
  const [cashierPayAmount, setCashierPayAmount] = React.useState("");
  const [cashierMethod, setCashierMethod] = React.useState("Tunai / Kasir Kantor");

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = React.useState<InvoiceItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadInvoices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data.map(mapSupabaseToInvoiceItem));
    } catch (err: unknown) {
      console.error("Gagal memuat invoice dari Supabase:", err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPI Calculations
  const totalTagihan = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalDiterima = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const sisaPiutang = invoices.reduce((acc, i) => acc + i.remainingAmount, 0);
  const lunasCount = invoices.filter((i) => i.status === "Lunas").length;
  const belumBayarCount = invoices.filter((i) => i.status === "Belum Bayar").length;
  const sebagianCount = invoices.filter((i) => i.status === "Sebagian").length;
  const kolektibilitas = totalTagihan > 0 ? Math.round((totalDiterima / totalTagihan) * 100) : 0;

  // Handler: Click "Bayar" -> Open Midtrans Payment Modal
  const handleOpenPayment = (inv: InvoiceItem) => {
    setSelectedInvoiceForPayment({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      pilgrimName: inv.pilgrimName,
      packageName: inv.packageName,
      amount: inv.remainingAmount,
      phone: inv.phone,
      email: inv.email,
    });
    setPaymentModalOpen(true);
  };

  // Handler: Payment Succeeded via Midtrans Snap
  const handlePaymentSuccess = async (
    invoiceNumber: string,
    paidAmount: number,
    channel: string,
    orderId: string
  ) => {
    try {
      const target = invoices.find((inv) => inv.invoiceNumber === invoiceNumber);
      if (target) {
        await recordInvoicePayment(target.id, paidAmount, channel, orderId);
        await loadInvoices();
      }
      showToast(`Pembayaran via ${channel} berhasil diproses! Status diperbarui.`);
    } catch (err: unknown) {
      console.error("Error recording payment:", err);
      showToast("Gagal memperbarui status pembayaran ke database.");
    }
  };

  // Handler: Open Cashier Record Modal
  const handleOpenCashierRecord = (inv: InvoiceItem) => {
    setSelectedInvoiceForCashier(inv);
    setCashierPayAmount(inv.remainingAmount.toString());
    setCashierModalOpen(true);
  };

  // Handler: Submit Cashier Record
  const handleSubmitCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForCashier) return;

    const amountPaid = Number(cashierPayAmount) || selectedInvoiceForCashier.remainingAmount;
    try {
      await recordInvoicePayment(selectedInvoiceForCashier.id, amountPaid, cashierMethod);
      await loadInvoices();
      showToast(`Pencatatan kasir Rp ${amountPaid.toLocaleString("id-ID")} berhasil disimpan!`);
      setCashierModalOpen(false);
    } catch (err: unknown) {
      console.error("Gagal mencatat pembayaran kasir:", err);
      showToast("Gagal menyimpan pembayaran kasir ke Supabase.");
    }
  };

  // Filter Logic
  const filteredInvoices = invoices.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.bookingCode.toLowerCase().includes(q) ||
      item.pilgrimName.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (typeFilter !== "Semua" && item.typeBadge !== typeFilter) return false;

    if (statusFilter === "Lunas") return item.status === "Lunas";
    if (statusFilter === "Sebagian") return item.status === "Sebagian";
    if (statusFilter === "BelumBayar") return item.status === "Belum Bayar";

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Tagihan &amp; Kasir Pembayaran
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              Midtrans Sandbox &amp; Kasir
            </span>
            {!IS_PRODUCTION && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                MODE TESTING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola invoice DP &amp; cicilan, pencatatan kasir kantor, dan pembayaran online Midtrans Snap (QRIS, VA Bank).
          </p>
        </div>

        <button
          onClick={() => showToast("Fitur kalkulasi jadwal cicilan massal siap digunakan!")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Generate Cicilan Massal</span>
        </button>
      </div>

      {/* 4 Summary Cards matching Screenshot 2 */}
      <BillingStats
        totalTagihan={totalTagihan}
        totalDiterima={totalDiterima}
        sisaPiutang={sisaPiutang}
        kolektibilitas={kolektibilitas}
        totalCount={invoices.length}
        lunasCount={lunasCount}
        belumBayarCount={belumBayarCount}
      />

      {/* Filter & Search Bar matching Screenshot 2 */}
      <BillingFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => setAppliedSearch(searchQuery)}
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        counts={{
          total: invoices.length,
          lunas: lunasCount,
          sebagian: sebagianCount,
          belumBayar: belumBayarCount,
        }}
        onGenerateCicilan={() => showToast("Fitur kalkulasi jadwal cicilan massal siap digunakan!")}
      />

      {/* Invoices Table matching Screenshot 2 */}
      <BillingTable
        invoices={filteredInvoices}
        onPay={handleOpenPayment}
        onCashierRecord={handleOpenCashierRecord}
        onReceipt={(item) => setSelectedReceipt(item)}
        onSync={(item) => showToast(`Sinkronisasi status Midtrans untuk ${item.invoiceNumber} berhasil!`)}
      />

      {/* Midtrans Professional Payment Modal matching Screenshot 3 */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        onViewReceipt={(invNum) => {
          const inv = invoices.find((i) => i.invoiceNumber === invNum);
          if (inv) setSelectedReceipt(inv);
        }}
      />

      {/* Manual Cashier Record Modal */}
      {cashierModalOpen && selectedInvoiceForCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Catat Pembayaran Kasir
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedInvoiceForCashier.invoiceNumber} • {selectedInvoiceForCashier.pilgrimName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCashierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCashier} className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Tagihan:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    Rp {selectedInvoiceForCashier.remainingAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="text-slate-700">{selectedInvoiceForCashier.dueDate}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  JUMLAH PEMBAYARAN (RP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={cashierPayAmount}
                  onChange={(e) => setCashierPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  METODE PEMBAYARAN
                </label>
                <select
                  value={cashierMethod}
                  onChange={(e) => setCashierMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option>Tunai / Kasir Kantor</option>
                  <option>Transfer Bank Mandiri</option>
                  <option>Transfer Bank BSI</option>
                  <option>Transfer BCA Syariah</option>
                  <option>QRIS Midtrans</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCashierModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kwitansi Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 text-xs">
            <div className="text-center border-b border-slate-100 pb-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold mb-2">
                TU
              </div>
              <h3 className="font-bold text-slate-900 text-base">Al-Madinah Travel</h3>
              <p className="text-[11px] text-slate-400">BUKTI KWITANSI PEMBAYARAN RESMI</p>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-sans">No. Kwitansi:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-sans">Diterima dari:</span>
                <span className="font-sans font-medium text-slate-800">{selectedReceipt.pilgrimName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-sans">Untuk Pembayaran:</span>
                <span className="font-sans text-slate-700">{selectedReceipt.typeBadge} {selectedReceipt.packageName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-sans">Jumlah Lunas:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  Rp {selectedReceipt.paidAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Status:</span>
                <span className="text-emerald-700 font-semibold font-sans">LUNAS / SAH</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 text-xs transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Kwitansi</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
