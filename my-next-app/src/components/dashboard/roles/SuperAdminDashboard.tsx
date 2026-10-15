"use client";

import * as React from "react";
import {
  Users,
  UserCheck,
  CreditCard,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { TrendLineChart, DonutChart, OccupancyBars } from "../shared/Charts";
import { fetchAdminDashboard, AdminDashboardData } from "@/features/dashboard/services/dashboardService";

interface SuperAdminDashboardProps {
  isAdminCabang?: boolean;
}

function formatCompactRp(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  isAdminCabang = false,
}) => {
  const [data, setData] = React.useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchAdminDashboard(isAdminCabang ? undefined : undefined);
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isAdminCabang]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl bg-[#033c2a] p-8 animate-pulse h-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-2xl border border-slate-100 bg-white p-6 h-72 animate-pulse" />
          <div className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white p-6 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        Gagal memuat data dashboard. Silakan refresh halaman.
      </div>
    );
  }

  const { kpis, trendData, paymentSegments, occupancyItems, departures } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Emerald Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#033c2a] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-emerald-200 border border-emerald-700/50 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {isAdminCabang
              ? "Ringkasan Operasional Cabang"
              : "Ringkasan Operasional Multi-Cabang"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang di Portal Manajemen Travel
          </h1>

          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
            Pantau pertumbuhan jamaah, sisa kuota paket umroh & haji, status pembayaran,
            dan manifest keberangkatan secara real-time.
          </p>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Jamaah Terdaftar
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.totalJamaah.toLocaleString("id-ID")}</span>
            {kpis.jamaahGrowth !== 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {kpis.jamaahGrowth > 0 ? "+" : ""}{kpis.jamaahGrowth}% bln ini
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {isAdminCabang ? "Jamaah aktif cabang ini" : "Jamaah aktif di seluruh cabang"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Pendaftaran Aktif
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.pendaftaranAktif}</span>
            {kpis.newRegistrations > 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{kpis.newRegistrations} pendaftar
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Musim berjalan</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Omzet Kas Masuk
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatCompactRp(kpis.omzetKasMasuk)}
            </span>
            {kpis.revenueGrowth !== 0 && (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {kpis.revenueGrowth > 0 ? "+" : ""}{kpis.revenueGrowth}% MoM
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Total pembayaran terverifikasi</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sisa Tagihan Outstanding
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatCompactRp(kpis.sisaTagihan)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cicilan jatuh tempo</p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Tren Pendaftaran Jamaah</h3>
              <p className="text-xs text-slate-400">Pertumbuhan pendaftaran bulanan tahun berjalan</p>
            </div>
            {kpis.jamaahGrowth > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                +{kpis.jamaahGrowth}%
              </span>
            )}
          </div>
          <div className="pt-2">
            <TrendLineChart
              color="emerald"
              dataPoints={trendData.map((d) => d.value)}
              labels={trendData.map((d) => d.label)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Status Pembayaran Tagihan</h3>
            <p className="text-xs text-slate-400">Distribusi pelunasan jamaah aktif</p>
          </div>
          <div className="py-2">
            <DonutChart segments={paymentSegments} />
          </div>
        </div>
      </div>

      {/* Row 3: Okupansi & Keberangkatan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900">Okupansi Kuota Paket</h3>
            <p className="text-xs text-slate-400">Perbandingan jamaah terdaftar vs kuota</p>
          </div>
          <OccupancyBars items={occupancyItems} />
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Jadwal Keberangkatan Terdekat</h3>
              <p className="text-xs text-slate-400">Grup penerbangan umroh & haji siap berangkat</p>
            </div>
            <a href="#semua" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Lihat Semua
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3 font-medium">Nama Paket</th>
                  <th className="pb-3 font-medium">Keberangkatan</th>
                  <th className="pb-3 font-medium">Maskapai</th>
                  <th className="pb-3 font-medium text-center">Terisi</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departures.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Belum ada jadwal keberangkatan</td>
                  </tr>
                ) : (
                  departures.map((dep) => {
                    const isUrgent = dep.daysUntil <= 14;
                    const isMedium = dep.daysUntil <= 45 && dep.daysUntil > 14;
                    const statusLabel = dep.status === "confirmed" ? "Terkonfirmasi" : "Menunggu";
                    const statusColor = dep.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100";

                    return (
                      <tr key={dep.id} className="group hover:bg-slate-50/60 transition">
                        <td className="py-3 font-semibold text-slate-900">{dep.packageName}</td>
                        <td className="py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className={`h-3 w-3 ${isUrgent ? "text-amber-500" : "text-slate-400"}`} />
                            {new Date(dep.departureDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            <span className={`rounded px-1 py-0.5 text-[10px] font-bold ml-1 ${
                              isUrgent ? "bg-amber-50 text-amber-700" : isMedium ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              H-{dep.daysUntil}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{dep.airline}</td>
                        <td className="py-3 text-center font-medium">
                          <span className="font-bold text-slate-900">{dep.booked}</span> / {dep.quota}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
