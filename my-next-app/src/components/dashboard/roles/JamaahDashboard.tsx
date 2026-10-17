"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CreditCard,
  FileCheck,
  Calendar,
} from "lucide-react";
import { PaymentModal, PaymentInvoiceData } from "@/components/payment/PaymentModal";
import {
  getInvoices,
  recordInvoicePayment,
  InvoiceWithDetails,
} from "@/services/invoiceService";
import { fetchJamaahDashboard, JamaahDashboardData } from "@/features/dashboard/services/dashboardService";

interface DocChecklistItem {
  name: string;
  status: "Terverifikasi" | "Sudah Diunggah" | "Belum Diunggah";
}

export const JamaahDashboard: React.FC = () => {
  const router = useRouter();


  const [invoices, setInvoices] = React.useState<InvoiceWithDetails[]>([]);
  const [totalBiaya, setTotalBiaya] = React.useState(0);
  const [tagihanAktif, setTagihanAktif] = React.useState(0);
  const [terbayar, setTerbayar] = React.useState(0);
  const [activeInvoice, setActiveInvoice] = React.useState<InvoiceWithDetails | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [dashData, setDashData] = React.useState<JamaahDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadInvoiceData = React.useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
      if (data.length > 0) {
        const inv = data[0];
        setActiveInvoice(inv);
        const total = Number(inv.amount) || 0;
        const paid = Number(inv.paid_amount) || 0;
        setTotalBiaya(total);
        setTerbayar(paid);
        setTagihanAktif(Math.max(0, total - paid));
      }
    } catch (err) {
      console.error("Gagal memuat status tagihan jamaah:", err);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const [result] = await Promise.all([fetchJamaahDashboard(), loadInvoiceData()]);
        if (!cancelled) setDashData(result);
      } catch (err) {
        console.error("Failed to load jamaah dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [loadInvoiceData]);

  const handlePaymentSuccess = async (
    _invoiceNumber: string,
    paidAmount: number,
    channel: string,
    orderId: string
  ) => {
    if (activeInvoice) {
      try {
        await recordInvoicePayment(activeInvoice.id, paidAmount, channel, orderId);
        await loadInvoiceData();
      } catch (err) {
        console.error("Gagal mencatat pembayaran:", err);
      }
    }
  };

  const booking = dashData?.booking;
  const pilgrimName = booking?.pilgrimName || "Jamaah";
  const packageName = booking?.packageName || "-";
  const daysUntil = booking?.daysUntilDeparture ?? 0;
  const departureDate = booking?.departureDate || "-";
  const durationDays = booking?.durationDays ?? 0;
  const documentItems: DocChecklistItem[] = (dashData?.documents || []).map((d) => ({
    name: d.name,
    status:
      d.status === "verified"
        ? "Terverifikasi"
        : d.status === "reviewing"
        ? "Sudah Diunggah"
        : "Belum Diunggah",
  }));

  const percentPaid = totalBiaya > 0 ? Math.min(100, Math.round((terbayar / totalBiaya) * 100)) : 0;
  const sisaTagihan = Math.max(0, totalBiaya - terbayar);

  const invoiceData: PaymentInvoiceData = {
    invoiceNumber: activeInvoice?.invoice_number || "-",
    pilgrimName: activeInvoice?.profiles?.full_name || pilgrimName,
    packageName: activeInvoice?.bookings?.packages?.name || packageName,
    amount: tagihanAktif > 0 ? tagihanAktif : 0,
    phone: activeInvoice?.profiles?.phone || "-",
    email: activeInvoice?.profiles?.email || "-",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-gray-200 rounded-lg p-5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-gray-200 rounded-lg p-6 animate-pulse" />
          <div className="h-64 bg-white border border-gray-200 rounded-lg p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section matching Screenshot 3 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Jamaah</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Selamat datang, {pilgrimName}
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status Pendaftaran */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Status Pendaftaran</div>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Dikonfirmasi
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Progress Pembayaran */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-600 shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Progress Pembayaran</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{percentPaid}%</div>
            <div className="text-[11px] text-gray-400">
              Rp {terbayar.toLocaleString("id-ID")} / Rp {totalBiaya.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Card 3: Dokumen Terverifikasi */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Dokumen Terverifikasi</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">3 / 6</div>
          </div>
        </div>

        {/* Card 4: Hitung Mundur */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">Hitung Mundur</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{daysUntil} hari</div>
            <div className="text-[11px] text-gray-400">{departureDate}</div>
          </div>
        </div>
      </div>

      {/* 2 Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Progress Pembayaran + Jadwal Manasik */}
        <div className="space-y-6">
          {/* Card: Progress Pembayaran */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Progress Pembayaran
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Terbayar</span>
                <span className="font-semibold text-gray-900">
                  Rp {terbayar.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden my-3">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Sisa Tagihan</span>
                <span className="font-semibold text-red-500">
                  Rp {sisaTagihan.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-5">
              <p className="font-bold text-sm text-gray-900">{packageName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Umroh • {durationDays} hari • Berangkat {departureDate}
              </p>
            </div>
          </div>

          {/* Card: Jadwal Manasik */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Jadwal Manasik
            </h2>

            <div className="flex items-center gap-3.5">
              <div className="flex flex-col items-center justify-center rounded-lg bg-teal-50 text-teal-700 w-12 h-12 shrink-0">
                <span className="text-sm font-bold leading-none">26</span>
                <span className="text-[11px] font-medium leading-none mt-1">Oct</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Manasik Umroh Reguler 9 Hari #2
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aula Kantor Pusat Jakarta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checklist Dokumen + Pengumuman Terbaru */}
        <div className="space-y-6">
          {/* Card: Checklist Dokumen */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Checklist Dokumen
            </h2>

            <div className="space-y-3.5">
              {documentItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  Belum ada dokumen tersimpan untuk akun ini.
                </p>
              ) : (
                documentItems.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-gray-800 font-normal">{doc.name}</span>
                  {doc.status === "Terverifikasi" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Terverifikasi
                    </span>
                  )}
                  {doc.status === "Sudah Diunggah" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Sudah Diunggah
                    </span>
                  )}
                  {doc.status === "Belum Diunggah" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Belum Diunggah
                    </span>
                  )}
                </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Pengumuman Terbaru */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Pengumuman Terbaru
            </h2>

            <div className="space-y-4">
              {/* Announcement 1 */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Jamaah
                  </span>
                  <span className="text-xs text-gray-400">15 Oct 2026</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Pelunasan Umroh Reguler
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Mohon segera melunasi biaya paket Umroh Reguler sebelum H-30 keberangkatan.
                </p>
              </div>

              {/* Announcement 2 */}
              <div className="pt-3.5 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Semua Pengguna
                  </span>
                  <span className="text-xs text-gray-400">14 Oct 2026</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Jadwal Manasik Akbar
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Manasik akbar akan dilaksanakan akhir bulan ini di aula utama. Wajib hadir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={invoiceData}
        onPaymentSuccess={handlePaymentSuccess}
        onViewReceipt={() => {
          router.push("/reports");
        }}
      />
    </div>
  );
};
