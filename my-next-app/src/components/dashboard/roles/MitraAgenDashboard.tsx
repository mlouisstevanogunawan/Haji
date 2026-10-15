"use client";

import * as React from "react";
import {
  Link2,
  CheckCircle2,
  Clock,
  Users,
  Copy,
  Check,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { TrendLineChart, DonutChart } from "../shared/Charts";
import { fetchAgentDashboard, AgentDashboardData } from "@/features/dashboard/services/dashboardService";

export const MitraAgenDashboard: React.FC = () => {
  const [copied, setCopied] = React.useState(false);
  const [data, setData] = React.useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchAgentDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to load agent dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const referralLink = data
    ? `https://travel-umroh.id/register?ref=${data.referralCode}`
    : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl bg-gradient-to-r from-[#c2410c] to-[#ea580c] p-8 animate-pulse h-48" />
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
        Gagal memuat data dashboard agen. Silakan refresh halaman.
      </div>
    );
  }

  const { kpis, trendData, paymentSegments, referrals } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Warm Orange Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c2410c] to-[#ea580c] p-6 sm:p-8 text-white shadow-xl shadow-orange-950/10">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-900/40 px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-orange-100 border border-orange-400/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            Portal Kemitraan Mitra Agen
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang, {data.agentName}
          </h1>

          <p className="text-sm text-orange-100/90 leading-relaxed max-w-2xl mb-6">
            Pantau perolehan komisi referral jamaah Anda, riwayat pencairan, dan status
            pembayaran jamaah bimbingan Anda.
          </p>

          <div className="rounded-xl bg-black/25 backdrop-blur-md p-4 max-w-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200/80 block mb-1">
                Tautan Referral Jamaah Anda
              </span>
              <span className="font-mono text-sm text-white font-medium select-all break-all">
                {referralLink}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-orange-50 transition active:scale-95 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Komisi Diperoleh
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Link2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              Rp {kpis.totalKomisi.toLocaleString("id-ID")}
            </span>
            {kpis.komisiBulanIni > 0 && (
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                +Rp {(kpis.komisiBulanIni / 1_000_000).toFixed(1)} Jt bln ini
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Akumulasi seluruh referral</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Komisi Sudah Dicairkan
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              Rp {kpis.sudahDicairkan.toLocaleString("id-ID")}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Ditransfer ke rekening mitra</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Komisi Siap Klaim
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              Rp {kpis.siapKlaim.toLocaleString("id-ID")}
            </span>
            {kpis.siapKlaim > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Dapat dicairkan
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Jamaah telah lunas</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Jamaah Referral
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.totalJamaahReferral} Jamaah</span>
            {kpis.jamaahBaru > 0 && (
              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{kpis.jamaahBaru} jamaah baru
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Terdaftar via kode {data.referralCode}</p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Tren Perolehan Komisi Bulanan</h3>
              <p className="text-xs text-slate-400">Pertumbuhan komisi referral Anda 5 bulan terakhir</p>
            </div>
            {trendData.length > 1 && trendData[trendData.length - 1].value > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                Aktif
              </span>
            )}
          </div>
          <div className="pt-2">
            <TrendLineChart
              color="amber"
              dataPoints={trendData.map((d) => d.value)}
              labels={trendData.map((d) => d.label)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Status Bayar Jamaah</h3>
            <p className="text-xs text-slate-400">
              Status pelunasan dari {kpis.totalJamaahReferral} referral Anda
            </p>
          </div>
          <div className="py-2">
            <DonutChart segments={paymentSegments} />
          </div>
        </div>
      </div>

      {/* Row 3: Referral Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Jamaah Referral Terbaru</h3>
            <p className="text-xs text-slate-400">
              Daftar calon jamaah yang mendaftar melalui tautan & kode agen Anda
            </p>
          </div>
          <button className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800">
            Klaim Komisi
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 font-medium">Nama Jamaah</th>
                <th className="pb-3 font-medium">Paket Ibadah</th>
                <th className="pb-3 font-medium">Tgl Pendaftaran</th>
                <th className="pb-3 font-medium">Estimasi Komisi</th>
                <th className="pb-3 font-medium text-right">Status Pencairan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Belum ada jamaah referral</td>
                </tr>
              ) : (
                referrals.map((ref) => {
                  const isLunas = ref.payoutStatus.includes("Lunas");
                  const statusColor = isLunas
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-100";

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-semibold text-slate-900">{ref.pilgrimName}</td>
                      <td className="py-3 text-slate-600">{ref.packageName}</td>
                      <td className="py-3 text-slate-500 whitespace-nowrap">
                        {ref.registrationDate ? new Date(ref.registrationDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {ref.estimatedCommission > 0 ? `Rp ${ref.estimatedCommission.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusColor}`}>
                          {ref.payoutStatus}
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
  );
};
