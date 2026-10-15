"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/Select";

export interface DocumentFiltersState {
  status: string;
  type: string;
  search: string;
}

export interface DocumentFiltersProps {
  filters: DocumentFiltersState;
  onChange: (filters: DocumentFiltersState) => void;
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onChange,
  summary,
}) => {
  const typeOptions = [
    { label: "Semua Tipe Dokumen", value: "ALL" },
    { label: "Paspor Fisik", value: "passport" },
    { label: "Visa Umroh / Haji", value: "visa" },
    { label: "Sertifikat Vaksin Meningitis", value: "vaccine_certificate" },
    { label: "Dokumen Lainnya", value: "other" },
  ];

  const statusTabs = [
    { label: "Semua", value: "ALL", count: summary.total },
    { label: "Menunggu Review", value: "pending", count: summary.pending },
    { label: "Disetujui", value: "approved", count: summary.approved },
    { label: "Ditolak", value: "rejected", count: summary.rejected },
  ];

  return (
    <div className="space-y-3">
      {/* Status Segmented Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onChange({ ...filters, status: tab.value })}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isActive
                  ? "bg-emerald-800 text-white shadow-emerald-900/20"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-amber-400 text-emerald-950 font-black"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Search & Select Row */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama jamaah, email, nomor paspor/dokumen..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              options={typeOptions}
              value={filters.type}
              onChange={(e) =>
                onChange({ ...filters, type: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskFilters = DocumentFilters;
