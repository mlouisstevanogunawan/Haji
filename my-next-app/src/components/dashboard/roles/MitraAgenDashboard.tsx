"use client";

import * as React from "react";
import {
  Users,
  CheckCircle2,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  fetchAgentDashboard,
  type AgentDashboardData,
} from "@/features/dashboard/services/dashboardService";
import { getAnnouncements, AnnouncementRow } from "@/services/announcementService";

function formatRpShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(2)} Jt`;
  return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
}

const AUDIENCE_LABELS: Record<string, { label: string; className: string }> = {
  all: { label: "Semua Pengguna", className: "bg-purple-50 text-purple-700" },
  agen: { label: "Agen", className: "bg-amber-50 text-amber-700" },
  jamaah: { label: "Jamaah", className: "bg-teal-50 text-teal-700" },
  muthawif: { label: "Muthawif", className: "bg-blue-50 text-blue-700" },
};

export const MitraAgenDashboard: React.FC = () => {
  const [data, setData] = React.useState<AgentDashboardData | null>(null);
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);


  React.useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [dashboard, anns] = await Promise.all([
          fetchAgentDashboard(),
          getAnnouncements().catch(() => [] as AnnouncementRow[]),
        ]);
        if (cancelled) return;
        setData(dashboard);
        setAnnouncements(
          (anns || [])
            .filter((a) => a.is_published)
            .sort(
              (a, b) =>
                new Date(b.published_at || b.created_at || 0).getTime() -
                new Date(a.published_at || a.created_at || 0).getTime()
            )
            .slice(0, 3)
        );
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

  // SVG dimensions for Komisi per Bulan bar chart
  const width = 680;
  const height = 220;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const trend = data?.trendData ?? [];
  const maxVal = Math.max(1_000_000, ...trend.map((t) => t.value));
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) =>
    Math.round((maxVal * f) / 100_000) * 100_000
  );

  // Donut chart calculations
  const donutSize = 140;
  const strokeWidth = 24;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = data?.paymentSegments ?? [];
  const kpis = data?.kpis;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard Agen{data ? ` — ${data.agentName}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ringkasan referral &amp; komisi Anda
          {data?.referralCode ? ` · Kode: ${data.referralCode}` : ""}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3">
          Gagal memuat data dashboard: {error}
        </div>
      )}

      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jamaah Referral */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-600 flex-shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Jamaah Referral</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {kpis ? kpis.totalJamaahReferral : "-"}
            </p>
          </div>
        </div>

        {/* Card 2: Total Komisi */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Komisi</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {kpis ? formatRpShort(kpis.totalKomisi) : "-"}
            </p>
          </div>
        </div>

        {/* Card 3: Komisi Dibayar */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Komisi Dibayar</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {kpis ? formatRpShort(kpis.sudahDicairkan) : "-"}
            </p>
          </div>
        </div>

        {/* Card 4: Komisi Pending */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Komisi Pending</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {kpis ? formatRpShort(kpis.siapKlaim) : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Komisi per Bulan & Status Bayar Jamaah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Card Komisi per Bulan (~68% width) */}
        <div className="lg:col-span-8 bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs flex flex-col justify-between">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Komisi per Bulan</h2>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[550px] select-none"
            >
              {/* Horizontal Grid lines & Y-axis labels */}
              {yTicks.map((tick) => {
                const y = paddingTop + (1 - tick / maxVal) * chartHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="inherit"
                    >
                      {tick === 0 ? "0" : tick.toLocaleString("id-ID")}
                    </text>
                  </g>
                );
              })}

              {/* Bars and X-axis labels */}
              {trend.map((item, idx) => {
                const barWidth = 26;
                const slotWidth = chartWidth / Math.max(trend.length, 1);
                const barX = paddingLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
                const barH = (item.value / maxVal) * chartHeight;
                const barY = paddingTop + chartHeight - barH;

                return (
                  <g key={item.label}>
                    {/* Teal Bar */}
                    {item.value > 0 && (
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barH}
                        fill="#0d9488"
                        rx="2"
                        className="transition-all hover:opacity-85"
                      >
                        <title>{`${item.label}: Rp ${item.value.toLocaleString("id-ID")}`}</title>
                      </rect>
                    )}

                    {/* Month Label */}
                    <text
                      x={barX + barWidth / 2}
                      y={paddingTop + chartHeight + 16}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="inherit"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Card Status Bayar Jamaah (~32% width) */}
        <div className="lg:col-span-4 bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Status Bayar Jamaah</h2>

            {/* Legend diisi dari data pembayaran referral */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-600 mb-4">
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
          </div>

          {/* Centered Donut Chart */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-36 h-36">
              <svg viewBox={`0 0 ${donutSize} ${donutSize}`} className="w-full h-full -rotate-90">
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                />
                {segments.map((s, i) => {
                  const length = (s.percent / 100) * circumference;
                  const offset = segments
                    .slice(0, i)
                    .reduce((acc, x) => acc + (x.percent / 100) * circumference, 0);
                  return (
                    <circle
                      key={s.label}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                    >
                      <title>{`${s.label}: ${s.count}`}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-400">
            {data
              ? `${kpis?.totalJamaahReferral ?? 0} Jamaah (${segments[0]?.percent ?? 0}% Lunas)`
              : "Memuat data..."}
          </div>
        </div>
      </div>

      {/* Row 3: Card Referral Terbaru */}
      <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Referral Terbaru</h2>

        {data && data.referrals.length === 0 && (
          <p className="text-xs text-gray-400 pt-1">Belum ada jamaah referral tersimpan.</p>
        )}

        <div className="space-y-4 pt-1 divide-y divide-gray-100">
          {(data?.referrals ?? []).slice(0, 6).map((r) => (
            <div key={r.id} className="pt-2 first:pt-0 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900">{r.pilgrimName}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {r.packageName} · daftar {r.registrationDate || "-"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-gray-900">
                  {formatRpShort(r.estimatedCommission)}
                </p>
                <p className="text-[11px] text-gray-400">{r.payoutStatus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Card Pengumuman Terbaru */}
      <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Pengumuman Terbaru</h2>

        {announcements.length === 0 && (
          <p className="text-xs text-gray-400 pt-1">Belum ada pengumuman terbit.</p>
        )}

        <div className="space-y-4 pt-1 divide-y divide-gray-100">
          {announcements.map((a) => {
            const audience =
              AUDIENCE_LABELS[a.target_audience || "all"] || {
                label: a.target_audience || "Umum",
                className: "bg-gray-50 text-gray-700",
              };
            const dateLabel = (a.published_at || a.created_at || "").split("T")[0];
            return (
              <div key={a.id} className="pt-3 first:pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${audience.className}`}
                  >
                    {audience.label}
                  </span>
                  <span className="text-[11px] text-gray-400">{dateLabel || "-"}</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
