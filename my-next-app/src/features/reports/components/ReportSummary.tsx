import * as React from "react";
import { ReportSummaryData } from "../types/report.types";
import { formatRupiah } from "@/lib/utils";
import { DollarSign, Users, Receipt, ArrowUpRight } from "lucide-react";

interface ReportSummaryProps {
  summary: ReportSummaryData;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Pendapatan Terfilter */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Pembayaran Masuk
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(summary.totalRevenue)}
          </span>
        </div>
        <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>{summary.successfulTransactions} transaksi terverifikasi</span>
        </div>
      </div>

      {/* 2. Jumlah Jamaah Bulan Ini */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Jamaah Melakukan Transaksi
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {summary.pilgrimsCountThisMonth}
          </span>
          <span className="text-xs font-semibold text-slate-500">Orang Jamaah</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Tercatat dalam periode filter aktif
        </div>
      </div>

      {/* 3. Rata-rata Pembayaran per Transaksi */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rata-rata Nilai Setoran
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(summary.avgPaymentPerPilgrim)}
          </span>
        </div>
        <div className="mt-2 text-xs text-purple-700 font-medium">
          Kombinasi DP & Pelunasan
        </div>
      </div>

      {/* 4. Total Transaksi */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Record Transaksi
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {summary.totalTransactions}
          </span>
          <span className="text-xs font-semibold text-slate-500">Kuitansi</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {summary.successfulTransactions} Sukses, 0 Gagal
        </div>
      </div>
    </div>
  );
};
