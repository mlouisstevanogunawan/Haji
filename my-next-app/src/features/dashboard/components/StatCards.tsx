import * as React from "react";
import { Users, CalendarClock, Wallet, Stamp, TrendingUp } from "lucide-react";
import { DashboardStats } from "@/types/database.types";
import { formatRupiah } from "@/lib/utils";

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Jamaah */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Jamaah Terdaftar
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {stats.totalPilgrims}
          </span>
          <span className="text-xs font-semibold text-slate-500">Orang</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{stats.activePilgrimsGrowth}% dari bulan lalu</span>
        </div>
      </div>

      {/* 2. Keberangkatan Terdekat */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Keberangkatan Terdekat
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {stats.closestDepartureDays}
          </span>
          <span className="text-xs font-semibold text-slate-500">Hari Lagi</span>
        </div>
        <div className="mt-3 text-xs text-slate-600 truncate font-medium">
          📅 {stats.nextDepartureDate}
        </div>
      </div>

      {/* 3. Total Pendapatan */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Akumulasi Pendapatan
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-amber-300 shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(stats.totalRevenue)}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{stats.revenueGrowth}% target kuartal ini</span>
        </div>
      </div>

      {/* 4. Status Visa & Sisa Kuota */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Manifes Visa & Kuota
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Stamp className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-800">
              {stats.visaIssuedCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Visa Terbit</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-2xl font-black text-amber-600">
              {stats.visaPendingCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Proses Nusuk</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-2xl font-black text-slate-800">
              {stats.remainingQuotaSummary}
            </div>
            <div className="text-[11px] font-medium text-slate-500">Sisa Seat</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-purple-800 font-medium">
          ✓ Terverifikasi Tasheel & Kemenag
        </div>
      </div>
    </div>
  );
};
