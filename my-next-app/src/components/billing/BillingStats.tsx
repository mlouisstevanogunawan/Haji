"use client";

import * as React from "react";
import { CreditCard, Banknote, Clock, TrendingUp } from "lucide-react";

export interface BillingStatsProps {
  totalTagihan: number;
  totalDiterima: number;
  sisaPiutang: number;
  kolektibilitas: number;
  totalCount: number;
  lunasCount: number;
  belumBayarCount: number;
}

export const BillingStats: React.FC<BillingStatsProps> = ({
  totalTagihan,
  totalDiterima,
  sisaPiutang,
  kolektibilitas,
  totalCount,
  lunasCount,
  belumBayarCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Tagihan Terbit */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600 shrink-0">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL TAGIHAN TERBIT
          </p>
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono">
            Rp {totalTagihan.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400">{totalCount} invoice terdaftar</p>
        </div>
      </div>

      {/* 2. Total Kas Diterima */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          <Banknote className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL KAS DITERIMA
          </p>
          <p className="text-base sm:text-lg font-bold text-emerald-600 font-mono">
            Rp {totalDiterima.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400">{lunasCount} invoice lunas</p>
        </div>
      </div>

      {/* 3. Sisa Piutang Jamaah */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SISA PIUTANG JAMAAH
          </p>
          <p className="text-base sm:text-lg font-bold text-rose-500 font-mono">
            Rp {sisaPiutang.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400">
            {belumBayarCount} invoice belum bayar
          </p>
        </div>
      </div>

      {/* 4. Kolektibilitas Kasir */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shrink-0">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            KOLEKTIBILITAS KASIR
          </p>
          <p className="text-base sm:text-lg font-bold text-sky-600">
            {kolektibilitas}%
          </p>
          <p className="text-[11px] text-slate-400">Rasio pelunasan invoice</p>
        </div>
      </div>
    </div>
  );
};
