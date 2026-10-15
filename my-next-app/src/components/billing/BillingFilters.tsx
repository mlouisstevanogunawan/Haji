"use client";

import * as React from "react";
import { Search, ChevronDown, Zap } from "lucide-react";

export interface BillingFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  counts: {
    total: number;
    lunas: number;
    sebagian: number;
    belumBayar: number;
  };
  onGenerateCicilan: () => void;
}

export const BillingFilters: React.FC<BillingFiltersProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  counts,
  onGenerateCicilan,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm space-y-2.5">
      {/* Search Bar & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchSubmit();
              }}
              placeholder="Cari kode invoice, booking REG, nama jamaah..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>
          <button
            onClick={onSearchSubmit}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-semibold transition cursor-pointer"
          >
            Cari
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Tipe Tagihan</option>
              <option value="Uang Muka (DP)">Uang Muka (DP)</option>
              <option value="Cicilan">Cicilan</option>
              <option value="Pelunasan">Pelunasan</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={onGenerateCicilan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
          >
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Generate Cicilan Massal</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching Screenshot 2 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onStatusChange("Semua")}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
            selectedStatus === "Semua"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua Tagihan ({counts.total})
        </button>
        <button
          onClick={() => onStatusChange("Lunas")}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
            selectedStatus === "Lunas"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Lunas ({counts.lunas})
        </button>
        <button
          onClick={() => onStatusChange("Sebagian")}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
            selectedStatus === "Sebagian"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Sebagian ({counts.sebagian})
        </button>
        <button
          onClick={() => onStatusChange("BelumBayar")}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
            selectedStatus === "BelumBayar"
              ? "bg-slate-900 text-white font-semibold shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Belum Bayar ({counts.belumBayar})
        </button>
      </div>
    </div>
  );
};
