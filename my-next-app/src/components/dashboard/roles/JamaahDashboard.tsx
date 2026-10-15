"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  UploadCloud,
  AlertCircle,
} from "lucide-react";
import { PaymentModal, PaymentInvoiceData } from "@/components/payment/PaymentModal";
import {
  getInvoices,
  recordInvoicePayment,
  InvoiceWithDetails,
} from "@/services/invoiceService";
import { fetchJamaahDashboard, JamaahDashboardData } from "@/features/dashboard/services/dashboardService";

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
    return () => { cancelled = true; };
  }, [loadInvoiceData]);

  const handlePaymentSuccess = async (_invoiceNumber: string, paidAmount: number, channel: string) => {
    if (activeInvoice) {
      try {
        await recordInvoicePayment(activeInvoice.id, paidAmount, channel);
        await loadInvoiceData();
      } catch (err) {
        console.error("Gagal mencatat pembayaran:", err);
      }
    }
  };

  const percentPaid = totalBiaya > 0 ? Math.round((terbayar / totalBiaya) * 100) : 0;
  const isLunas = tagihanAktif === 0 && totalBiaya > 0;

  const booking = dashData?.booking;
  const pilgrimName = booking?.pilgrimName || "Jamaah";
  const packageName = booking?.packageName || "Paket Umroh";
  const daysUntil = booking?.daysUntilDeparture ?? 0;
  const airline = booking?.airline || "-";
  const flightNumber = booking?.flightNumber || "-";
  const hotelMakkah = booking?.hotelMakkah || "-";
  const hotelMadinah = booking?.hotelMadinah || "-";
  const regCode = booking?.registrationCode || "-";
  const durationDays = booking?.durationDays || 9;

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
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl bg-[#033c2a] p-8 animate-pulse h-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 h-64 animate-pulse" />
          <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#033c2a] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-emerald-200 border border-emerald-700/50 mb-3">
            <span className="font-mono">#</span>
            Pendaftaran Dikonfirmasi • Kode: {regCode}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
            Ahlan Wa Sahlan, {pilgrimName}!
          </h1>
          <p className="text-sm text-emerald-100/80 mb-6">
            {packageName} ({durationDays} Hari)
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 rounded-xl bg-black/25 backdrop-blur-md p-4 border border-white/10 max-w-4xl">
            <div className="flex items-center gap-3.5 bg-emerald-900/60 rounded-lg px-4 py-2.5 border border-emerald-700/50 flex-shrink-0">
              <span className="text-3xl font-black text-white">{daysUntil}</span>
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-emerald-200 block uppercase">HARI LAGI</span>
                <span className="text-emerald-100/80">Menuju Tanah Suci</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-emerald-100/90 pl-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
              <div className="flex items-center gap-2">
                <Plane className="h-3.5 w-3.5 text-amber-300 flex-shrink-0" />
                <span>
                  <strong>{airline}{flightNumber !== "-" ? ` (${flightNumber})` : ""}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-amber-300 flex-shrink-0" />
                <span>
                  Makkah: <strong>{hotelMakkah}</strong> • Madinah: <strong>{hotelMadinah}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Status Pembayaran & Dokumen */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Status Pembayaran Paket */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Status Pembayaran Paket</h3>
                <p className="text-xs text-slate-400">Rincian pembayaran biaya keberangkatan umroh Anda</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold border transition-colors ${
                isLunas
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100"
              }`}>
                {isLunas ? "Lunas (100%)" : totalBiaya > 0 ? `Terbayar (${percentPaid}%)` : "Belum Ada Tagihan"}
              </span>
            </div>

            {totalBiaya > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>
                    Terbayar <strong className="text-slate-900">Rp {terbayar.toLocaleString("id-ID")}</strong>
                  </span>
                  <span>
                    Total: <strong className="text-slate-900">Rp {totalBiaya.toLocaleString("id-ID")}</strong>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
              </div>
            )}

            <div className={`mt-6 rounded-xl border p-4 flex items-center justify-between transition-all ${
              isLunas
                ? "bg-emerald-50/70 border-emerald-200/80"
                : "bg-amber-50/70 border-amber-200/60"
            }`}>
              <div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                  isLunas ? "text-emerald-800" : "text-amber-800"
                }`}>
                  {isLunas ? "Status Tagihan" : "Tagihan Aktif (Uang Muka / DP)"}
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                  {isLunas ? "Lunas Sepenuhnya" : tagihanAktif > 0 ? `Rp ${tagihanAktif.toLocaleString("id-ID")}` : "Belum Ada Tagihan"}
                </span>
              </div>
              {!isLunas && tagihanAktif > 0 ? (
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <span>Bayar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : isLunas ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Terbayar</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Kuitansi resmi langsung terbit otomatis setelah pembayaran.
            </span>
            <button
              type="button"
              onClick={() => router.push("/reports")}
              className="font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap ml-2 cursor-pointer"
            >
              Semua Invoice
            </button>
          </div>
        </div>

        {/* Right: Kelengkapan Berkas Dokumen */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Kelengkapan Berkas Dokumen</h3>
              <p className="text-xs text-slate-400">Checklist persyaratan visa umroh & manifest penerbangan</p>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Berkas
            </button>
          </div>

          <div className="space-y-3">
            {(dashData?.documents || []).map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50/50 transition">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{doc.name}</p>
                  <p className="text-[11px] text-slate-400">{doc.subLabel}</p>
                </div>
                {doc.status === "verified" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3" />
                    Terverifikasi
                  </span>
                ) : doc.status === "reviewing" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                    <Clock className="h-3 w-3" />
                    Diperiksa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    <AlertCircle className="h-3 w-3 text-slate-400" />
                    Belum Upload
                  </span>
                )}
              </div>
            ))}
            {(!dashData?.documents || dashData.documents.length === 0) && (
              <div className="py-6 text-center text-xs text-slate-400">Belum ada data dokumen</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Manasik & Perlengkapan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Jadwal Bimbingan Manasik */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900">Jadwal Bimbingan Manasik Umroh</h3>
            <p className="text-xs text-slate-400">Sesi pembekalan fikih dan tata cara ibadah sebelum terbang</p>
          </div>

          {dashData?.manasik ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">SESI BIMBINGAN</span>
                <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-sm">Wajib Hadir</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{dashData.manasik.title}</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">{dashData.manasik.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{dashData.manasik.location}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-400">
              Belum ada jadwal manasik terjadwal
            </div>
          )}
        </div>

        {/* Right: Perlengkapan Ibadah */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-base text-slate-900">Perlengkapan Ibadah Jamaah</h3>
              <p className="text-xs text-slate-400">Status logistik koper, seragam, dan perlengkapan ibadah</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(dashData?.equipment || []).map((item, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-800 mb-1">{item.name}</p>
                  {item.status === "received" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Sudah Diterima
                    </span>
                  ) : item.status === "airport" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      Dibagi di Bandara
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                      Belum Tersedia
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Hubungi petugas logistik di kantor cabang jika ada perlengkapan yang cacat atau belum lengkap.
          </p>
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
