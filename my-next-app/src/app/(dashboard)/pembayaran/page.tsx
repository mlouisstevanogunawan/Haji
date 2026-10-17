"use client";

import * as React from "react";
import Link from "next/link";
import {
  Filter,
  Plus,
  ChevronDown,
  Eye,
  X,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import {
  getInvoices,
  recordInvoicePayment,
  createInvoicesForBookings,
  InvoiceWithDetails,
} from "@/services/invoiceService";
import { getPackages, PackageRow } from "@/services/packageService";
import { PaymentModal, PaymentInvoiceData } from "@/components/payment/PaymentModal";

export interface InvoiceItem {
  id: string;
  code: string;
  jamaah: string;
  jamaahId: string | null;
  paket: string;
  jenis: "Cicilan" | "Uang Muka (DP)";
  tagihan: number;
  dibayar: number;
  status: "Lunas" | "Belum Bayar";
  jatuhTempo: string;
  phone?: string;
  email?: string;
}

export default function PembayaranPage() {
  const { role, user } = useRole();
  const isJamaah = role === "jamaah_umroh";
  const userId = user.id;

  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [jenisFilter, setJenisFilter] = React.useState("Semua Jenis");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");
  const [appliedJenis, setAppliedJenis] = React.useState("Semua Jenis");
  const [isRecording, setIsRecording] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = isJamaah ? 10 : 15;

  // Modals
  const [detailItem, setDetailItem] = React.useState<InvoiceItem | null>(null);
  const [isMassModalOpen, setIsMassModalOpen] = React.useState(false);
  const [massPackage, setMassPackage] = React.useState("");
  const [massScheme, setMassScheme] = React.useState("Cicilan Bulanan (3x Termin)");
  const [massMessage, setMassMessage] = React.useState<string | null>(null);
  const [massIsProcessing, setMassIsProcessing] = React.useState(false);
  const [packageOptions, setPackageOptions] = React.useState<PackageRow[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [paymentData, setPaymentData] = React.useState<PaymentInvoiceData | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [data, pkgs] = await Promise.all([
        getInvoices(),
        getPackages().catch(() => [] as PackageRow[]),
      ]);
      setPackageOptions(pkgs || []);
      const mapped: InvoiceItem[] = (data || []).map((inv) => {
        const total = Number(inv.amount) || 0;
        const paid = Number(inv.paid_amount) || 0;
        let formattedDate = inv.due_date;
        try {
          formattedDate = new Date(inv.due_date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch {}
        return {
          id: inv.id,
          code: inv.invoice_number,
          jamaah: inv.profiles?.full_name || "-",
          jamaahId: inv.jamaah_id ?? null,
          paket: inv.bookings?.packages?.name || "-",
          jenis: inv.type === "dp" ? "Uang Muka (DP)" : "Cicilan",
          tagihan: total,
          dibayar: paid,
          status: inv.status === "paid" || (total > 0 && paid >= total) ? "Lunas" : "Belum Bayar",
          jatuhTempo: formattedDate,
          phone: inv.profiles?.phone || "-",
          email: inv.profiles?.email || undefined,
        };
      });

      // Jamaah hanya melihat tagihan miliknya sendiri (jamaah_id = user.id login).
      setInvoices(
        isJamaah
          ? mapped.filter((inv) => inv.jamaahId === userId)
          : mapped
      );
    } catch (err: unknown) {
      console.error("Gagal memuat daftar tagihan:", err);
      alert(`Gagal memuat daftar tagihan: ${(err as Error).message}`);
    }
  }, [isJamaah, userId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyFilter = () => {
    setAppliedStatus(statusFilter);
    setAppliedJenis(jenisFilter);
    setCurrentPage(1);
  };

  const filteredInvoices = invoices.filter((item) => {
    const matchesStatus =
      appliedStatus === "Semua Status" ||
      item.status.toLowerCase() === appliedStatus.toLowerCase();
    const matchesJenis =
      appliedJenis === "Semua Jenis" ||
      item.jenis.toLowerCase() === appliedJenis.toLowerCase();
    return matchesStatus && matchesJenis;
  });

  const totalResults = filteredInvoices.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Pilihan paket diambil dari tabel packages yang asli, supaya tagihan bisa
  // dibuat juga untuk booking yang belum punya invoice sama sekali.
  const namaPaketTerkait = React.useMemo(
    () => Array.from(new Set(packageOptions.map((p) => p.name).filter(Boolean))),
    [packageOptions]
  );

  const handleProcessMassInvoice = async () => {
    setMassIsProcessing(true);
    try {
      const result = await createInvoicesForBookings(massPackage, massScheme);
      const parts = [`${result.created} tagihan baru tersimpan ke Supabase`];
      if (result.skippedExisting) parts.push(`${result.skippedExisting} booking sudah punya tagihan`);
      if (result.skippedNoAmount) parts.push(`${result.skippedNoAmount} booking dilewati (nominal/harga DP belum diisi di paket)`);
      if (result.failed) parts.push(`${result.failed} gagal ditulis`);
      setMassMessage(parts.join(", ") + ".");
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal membuat tagihan massal:", err);
      setMassMessage(`Gagal membuat tagihan: ${(err as Error).message}`);
    } finally {
      setMassIsProcessing(false);
    }
  };

  const handleOpenPayment = (item: InvoiceItem) => {
    setPaymentData({
      id: item.id,
      invoiceNumber: item.code,
      pilgrimName: item.jamaah,
      packageName: item.paket,
      amount: item.tagihan,
      phone: item.phone || "-",
      email: item.email,
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (
    _invoiceNumber: string,
    paidAmount: number,
    channel: string,
    orderId: string
  ) => {
    if (!paymentData?.id) {
      setPaymentModalOpen(false);
      return;
    }

    setIsRecording(true);
    try {
      // Pembayaran ditulis ke Supabase (paid_amount bertambah + dedup lewat order_id),
      // lalu tabel dibaca ulang dari database — bukan simulasi lokal.
      await recordInvoicePayment(paymentData.id, paidAmount, channel, orderId);
      setPaymentModalOpen(false);
      await loadData();
      alert(`Pembayaran ${channel} sebesar Rp ${Number(paidAmount).toLocaleString("id-ID")} berhasil dicatat.`);
    } catch (err: unknown) {
      console.error("Gagal mencatat pembayaran:", err);
      alert(`Pembayaran berjalan di gateway tapi gagal dicatat ke database: ${(err as Error).message}`);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Pembayaran</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran &amp; Cicilan</h1>
          <p className="text-sm text-gray-500">Daftar tagihan jamaah</p>
        </div>

        {/* Primary Button (Admin only) */}
        {!isJamaah && (
          <div>
            <button
              onClick={() => setIsMassModalOpen(true)}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
            >
              <Receipt className="h-4 w-4" />
              <span>Buat Tagihan Massal</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Dropdown Status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm min-w-[150px]"
          >
            <option>Semua Status</option>
            <option>Lunas</option>
            <option>Belum Bayar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown Jenis */}
        <div className="relative">
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm min-w-[150px]"
          >
            <option>Semua Jenis</option>
            <option>Cicilan</option>
            <option>Uang Muka (DP)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Tombol Filter */}
        <button
          onClick={handleApplyFilter}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filter</span>
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JENIS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TAGIHAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DIBAYAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JATUH TEMPO
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInvoices.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Kode */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.code}
                  </td>

                  {/* Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.jamaah}
                  </td>

                  {/* Paket */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.paket}
                  </td>

                  {/* Jenis */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.jenis === "Cicilan" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Cicilan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Uang Muka (DP)
                      </span>
                    )}
                  </td>

                  {/* Tagihan */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    Rp {item.tagihan.toLocaleString("id-ID")}
                  </td>

                  {/* Dibayar */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    Rp {item.dibayar.toLocaleString("id-ID")}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status === "Lunas" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Belum Bayar
                      </span>
                    )}
                  </td>

                  {/* Jatuh Tempo */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.jatuhTempo}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/pembayaran/${
                        item.code.startsWith("REG-")
                          ? item.code.split("-").slice(0, 2).join("-")
                          : item.code
                      }`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-100 gap-3 text-xs text-gray-500">
            <span>
              Showing {Math.min(startIndex + 1, totalResults)} to{" "}
              {Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results
            </span>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg font-medium transition ${
                    currentPage === num
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Tagihan */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Detail Tagihan</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Nomor Tagihan</span>
                <span className="font-semibold text-gray-900">{detailItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Nama Jamaah</span>
                <span className="font-medium text-gray-900">{detailItem.jamaah}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Paket</span>
                <span className="font-medium text-gray-900">{detailItem.paket}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Jenis Pembayaran</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailItem.jenis === "Cicilan"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {detailItem.jenis}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Total Tagihan</span>
                <span className="font-bold text-gray-900">
                  Rp {detailItem.tagihan.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Jumlah Dibayar</span>
                <span className="font-semibold text-emerald-600">
                  Rp {detailItem.dibayar.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Sisa Tagihan</span>
                <span className="font-bold text-red-600">
                  Rp {Math.max(0, detailItem.tagihan - detailItem.dibayar).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailItem.status === "Lunas"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {detailItem.status}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Jatuh Tempo</span>
                <span className="text-gray-700">{detailItem.jatuhTempo}</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Tutup
              </button>
              {detailItem.status !== "Lunas" && (
                <button
                  onClick={() => {
                    handleOpenPayment(detailItem);
                    setDetailItem(null);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Bayar Online / Midtrans</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Tagihan Massal */}
      {isMassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Buat Tagihan Massal</h3>
              <button
                onClick={() => setIsMassModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p className="text-gray-600">
                Fitur ini akan menghasilkan tagihan cicilan secara otomatis untuk seluruh jamaah terdaftar sesuai jadwal jatuh tempo paket yang dipilih.
              </p>
              {massMessage && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {massMessage}
                </p>
              )}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Pilih Paket</label>
                <select
                  value={massPackage}
                  onChange={(e) => setMassPackage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Semua Paket Keberangkatan</option>
                  {namaPaketTerkait.map((nama) => (
                    <option key={nama} value={nama}>
                      {nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Skema Tagihan</label>
                <select
                  value={massScheme}
                  onChange={(e) => setMassScheme(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option>Cicilan Bulanan (3x Termin)</option>
                  <option>Cicilan Bulanan (6x Termin)</option>
                  <option>Uang Muka (DP) Standar</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMassModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={massIsProcessing}
                  onClick={handleProcessMassInvoice}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {massIsProcessing ? "Menyimpan..." : "Proses Tagihan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Midtrans Modal */}
      {paymentModalOpen && paymentData && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={paymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {isRecording && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          Mencatat pembayaran ke database...
        </div>
      )}
    </div>
  );
}
