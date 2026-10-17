"use client";

import * as React from "react";
import {
  Users,
  FileText,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  AreaRegistrationChart,
  DonutStatusChart,
  PackageBarChart,
} from "../shared/Charts";
import {
  fetchAdminDashboard,
  AdminDashboardData,
} from "@/features/dashboard/services/dashboardService";
import { getAnnouncements, AnnouncementRow } from "@/services/announcementService";

interface SuperAdminDashboardProps {
  isAdminCabang?: boolean;
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Semua Pengguna",
  jamaah: "Jamaah",
  agents: "Agen",
  staff: "Staf",
  muthawif: "Muthawif",
};

function formatDateId(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  isAdminCabang = true,
}) => {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [result, ancs] = await Promise.all([
          fetchAdminDashboard(undefined),
          getAnnouncements().catch((err) => {
            console.error("Gagal memuat pengumuman:", err);
            return [] as AnnouncementRow[];
          }),
        ]);
        if (cancelled) return;
        setData(result);
        setAnnouncements(
          (ancs || []).filter((a) => a.is_published).slice(0, 3)
        );
        setErrorMessage(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const pesan = (err as Error).message;
        console.error("Failed to load admin dashboard:", err);
        setErrorMessage(`Gagal memuat data dashboard: ${pesan}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAdminCabang]);

  const kpis = data?.kpis;
  const trendData = (data?.trendData || []).map((p) => ({
    month: p.label,
    value: p.value,
  }));
  const packageData = (data?.occupancyItems || []).map((o) => ({
    name: o.label,
    count: o.terisi,
  }));
  const paidCount = Number(data?.paymentSegments?.[0]?.count) || 0;
  const partialCount = Number(data?.paymentSegments?.[1]?.count) || 0;
  const unpaidCount = Number(data?.paymentSegments?.[2]?.count) || 0;
  const departuresList = data?.departures || [];

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
          Dashboard Operasional
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {isAdminCabang ? "Ringkasan cabang Anda" : "Ringkasan seluruh cabang"}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Jamaah */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 flex-shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400">Total Jamaah</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 mt-0.5">
                {loading ? "-" : kpis?.totalJamaah ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Pendaftaran Aktif */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400">Pendaftaran Aktif</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 mt-0.5">
                {loading ? "-" : kpis?.pendaftaranAktif ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Omzet Diterima */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400">Omzet Diterima</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 mt-0.5">
                {loading ? "-" : formatRp(kpis?.omzetKasMasuk ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400">Outstanding</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 mt-0.5">
                {loading ? "-" : formatRp(kpis?.sisaTagihan ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (12 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Pendaftaran 12 Bulan Terakhir */}
        <div className="lg:col-span-8 rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-sm text-gray-800">
              Pendaftaran 6 Bulan Terakhir
            </h2>
          </div>
          <AreaRegistrationChart data={trendData} />
        </div>

        {/* Status Pembayaran */}
        <div className="lg:col-span-4 rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-sm text-gray-800">
              Status Pembayaran
            </h2>
          </div>
          <DonutStatusChart
            lunas={paidCount}
            sebagian={partialCount}
            belumBayar={unpaidCount}
          />
        </div>
      </div>

      {/* Row 3: Jamaah per Paket & Keberangkatan Terdekat */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Jamaah per Paket */}
        <div className="lg:col-span-8 rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-sm text-gray-800">
              Jamaah per Paket
            </h2>
          </div>
          <PackageBarChart data={packageData} />
        </div>

        {/* Keberangkatan Terdekat */}
        <div className="lg:col-span-4 rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="font-bold text-sm text-gray-800">
              Keberangkatan Terdekat
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {departuresList.length === 0 ? (
              <p className="py-4 text-xs text-gray-400">
                Belum ada paket dengan tanggal keberangkatan.
              </p>
            ) : (
              departuresList.map((dep) => (
                <div key={dep.id} className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{dep.packageName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDateId(dep.departureDate)} • sisa kuota{" "}
                      {Math.max(0, dep.quota - dep.booked)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                      dep.status === "draft"
                        ? "bg-gray-100 text-gray-600"
                        : /haji/i.test(dep.packageName)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {/haji/i.test(dep.packageName) ? "Haji" : "Umroh"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Pengumuman Terbaru */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
        <h2 className="font-bold text-sm text-gray-800 mb-4">
          Pengumuman Terbaru
        </h2>
        {announcements.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada pengumuman terbit.</p>
        ) : (
          <div className="space-y-4 divide-y divide-gray-100">
            {announcements.map((a) => (
              <div key={a.id} className="pt-1 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
                    {AUDIENCE_LABELS[a.target_audience ?? "all"] ||
                      a.target_audience ||
                      "Semua Pengguna"}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatDateId(a.published_at || a.created_at)}
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 mt-2">
                  {a.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
