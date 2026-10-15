"use client";

import * as React from "react";
import {
  Users,
  BookOpen,
  CheckCircle2,
  Plane,
  Clock,
  MapPin,
  ClipboardCheck,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { DonutChart } from "../shared/Charts";
import { fetchMuthawifDashboard, MuthawifDashboardData } from "@/features/dashboard/services/dashboardService";

export const MuthawifDashboard: React.FC = () => {
  const [data, setData] = React.useState<MuthawifDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchMuthawifDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to load muthawif dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl bg-[#033c2a] p-8 animate-pulse h-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        Gagal memuat data dashboard muthawif. Silakan refresh halaman.
      </div>
    );
  }

  const { kpis, nextSession, attendanceSegments, jamaahList } = data;

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

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-800/80 px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-emerald-200 border border-emerald-700/50 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Portal Bimbingan Ibadah & Muthawif
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Ahlan Wa Sahlan, {data.muthawifName}
          </h1>

          <p className="text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
            Kelola presensi manasik jamaah, koordinasi rombongan penerbangan, dan pantau
            data kesehatan jamaah bimbingan Anda.
          </p>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Jamaah Bimbingan
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.totalJamaah} Jamaah</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Grup bimbingan aktif</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Sesi Manasik Selesai
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.sesiSelesai} dari {kpis.totalSesi} Sesi</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {kpis.totalSesi - kpis.sesiSelesai > 0
              ? `${kpis.totalSesi - kpis.sesiSelesai} sesi pemantapan tersisa`
              : "Semua sesi selesai"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Rata-rata Kehadiran
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.rataKehadiran}%</span>
            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
              kpis.rataKehadiran >= 80
                ? "text-emerald-700 bg-emerald-50"
                : kpis.rataKehadiran >= 60
                ? "text-amber-700 bg-amber-50"
                : "text-red-700 bg-red-50"
            }`}>
              {kpis.rataKehadiran >= 80 ? "Tinggi" : kpis.rataKehadiran >= 60 ? "Sedang" : "Rendah"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Presensi manasik aktif</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Keberangkatan Terdekat
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Plane className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.nextDepartureDate !== "-"
                ? new Date(kpis.nextDepartureDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                : "-"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{kpis.nextAirline}</p>
        </div>
      </div>

      {/* Row 2: Sesi Manasik & Presensi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Sesi Manasik Mendatang</h3>
                <p className="text-xs text-slate-400">Jadwal bimbingan teori & praktik yang Anda pimpin</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition active:scale-95">
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>Catat Presensi</span>
              </button>
            </div>

            {nextSession ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    SESI BERIKUTNYA
                  </span>
                  <span className="rounded-full bg-emerald-700 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                    Mendatang
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{nextSession.title}</h4>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">
                      {nextSession.sessionDate ? new Date(nextSession.sessionDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" }) : "-"}
                      {nextSession.sessionTime ? ` • ${nextSession.sessionTime}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{nextSession.location}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-400">
                Belum ada sesi manasik terjadwal
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {kpis.totalJamaah} jamaah dalam bimbingan
            </span>
            <a href="#rooming" className="font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
              Lihat Rooming List
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Presensi Kehadiran Jamaah</h3>
            <p className="text-xs text-slate-400">Rekap kehadiran sesi manasik terakhir</p>
          </div>
          <div className="py-2">
            <DonutChart segments={attendanceSegments} />
          </div>
        </div>
      </div>

      {/* Row 3: Daftar Jamaah Bimbingan Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Daftar Jamaah Bimbingan</h3>
            <p className="text-xs text-slate-400">Jamaah kloter binaan {data.muthawifName}</p>
          </div>
          <a href="#jamaah" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            Semua Jamaah
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 font-medium">Nama Jamaah</th>
                <th className="pb-3 font-medium">Kota Asal</th>
                <th className="pb-3 font-medium">WhatsApp</th>
                <th className="pb-3 font-medium">Tipe Kamar</th>
                <th className="pb-3 font-medium text-right">Progres Manasik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {jamaahList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Belum ada data jamaah bimbingan</td>
                </tr>
              ) : (
                jamaahList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 font-semibold text-slate-900">{j.name}</td>
                    <td className="py-3 text-slate-600">{j.city}</td>
                    <td className="py-3 text-slate-600 font-mono">{j.phone}</td>
                    <td className="py-3 text-slate-600">{j.roomType}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        {j.manasikProgress}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
