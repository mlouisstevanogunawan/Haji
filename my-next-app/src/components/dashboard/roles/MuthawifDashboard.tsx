"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Calendar, Check } from "lucide-react";
import { fetchMuthawifDashboard } from "@/features/dashboard/services/dashboardService";
import { getManasikSessions, ManasikSessionRecord } from "@/services/manasikService";
import { getAnnouncements, AnnouncementRow } from "@/services/announcementService";

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function tanggalParts(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { hari: "-", bulan: "-" };
  return { hari: String(d.getDate()), bulan: BULAN_SINGKAT[d.getMonth()] };
}

export const MuthawifDashboard: React.FC = () => {
  const [data, setData] = React.useState<Awaited<ReturnType<typeof fetchMuthawifDashboard>> | null>(null);
  const [sessions, setSessions] = React.useState<ManasikSessionRecord[]>([]);
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);


  React.useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [dashboard, allSessions, anns] = await Promise.all([
          fetchMuthawifDashboard(),
          getManasikSessions(),
          getAnnouncements(),
        ]);
        if (cancelled) return;
        setData(dashboard);
        setSessions(allSessions);
        setAnnouncements(anns || []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = sessions
    .filter((s) => (s.session_date || "") >= today)
    .slice(0, 3);
  const todaysCount = sessions.filter((s) => s.session_date?.split("T")[0] === today).length;

  const donutSize = 160;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = data?.attendanceSegments ?? [];

  return (
    <div className="space-y-6">
      {/* Header section matching Screenshot 3 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Muthawif{data ? ` — ${data.muthawifName}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Jamaah bimbingan &amp; jadwal manasik Anda
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
          Gagal memuat data dashboard: {error}
        </div>
      )}

      {/* 3 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Jamaah Bimbingan */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Jamaah Bimbingan</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {data ? data.kpis.totalJamaah : "-"}
            </p>
          </div>
        </div>

        {/* Stat 2: Manasik Hari Ini */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Manasik Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {data ? todaysCount : "-"}
            </p>
          </div>
        </div>

        {/* Stat 3: Total Kehadiran */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Kehadiran</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {data ? `${data.kpis.rataKehadiran}%` : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Row: Manasik Mendatang (kiri) & Rekap Kehadiran (kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Manasik Mendatang */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Manasik Mendatang
            </h2>

            {upcoming.length === 0 && (
              <p className="text-xs text-gray-400">Belum ada sesi manasik tersimpan.</p>
            )}

            <div className="divide-y divide-gray-100">
              {upcoming.map((s) => {
                const { hari, bulan } = tanggalParts(s.session_date);
                return (
                  <div key={s.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0">
                    <div className="flex items-center gap-3.5">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex-shrink-0 leading-tight">
                        <span className="text-xs font-bold leading-none">{hari}</span>
                        <span className="text-[10px] font-semibold uppercase leading-none mt-0.5">{bulan}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {s.title || "Sesi Manasik"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.location || "-"}
                          {s.session_time ? ` · ${s.session_time}` : ""}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/manasik/absensi/${s.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition whitespace-nowrap cursor-pointer"
                    >
                      Absensi
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Rekap Kehadiran with Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col items-center">
          <div className="w-full">
            <h2 className="text-base font-semibold text-gray-900 mb-4 text-left">
              Rekap Kehadiran
            </h2>

            {/* Legend diambil dari rekap absensi sesi terakhir */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-600 mb-4">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Donut Chart SVG */}
            <div className="flex justify-center items-center py-2">
              <svg className="w-44 h-44 -rotate-90" viewBox={`0 0 ${donutSize} ${donutSize}`}>
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="24"
                />
                {segments.map((s, i) => {
                  const length = (s.percent / 100) * circumference;
                  const offset = segments
                    .slice(0, i)
                    .reduce((acc, x) => acc + (x.percent / 100) * circumference, 0);
                  return (
                    <circle
                      key={s.label}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth="24"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                    >
                      <title>{`${s.label}: ${s.count}`}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              {data ? `${data.kpis.sesiSelesai}/${data.kpis.totalSesi} sesi selesai` : "Memuat data..."}
            </p>
          </div>
        </div>
      </div>

      {/* Card: Pengumuman Terbaru */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Pengumuman Terbaru
        </h2>

        {announcements.filter((a) => a.is_published).length === 0 && (
          <p className="text-xs text-gray-400">Belum ada pengumuman terbit.</p>
        )}

        <div className="space-y-4">
          {announcements
            .filter((a) => a.is_published)
            .slice(0, 3)
            .map((a) => (
              <div key={a.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {a.target_audience || "Umum"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(a.published_at || a.created_at || "").split("T")[0] || "-"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{a.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{a.content}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
