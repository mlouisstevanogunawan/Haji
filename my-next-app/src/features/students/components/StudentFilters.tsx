import * as React from "react";
import { Search, Filter, X } from "lucide-react";
import { StudentFiltersState } from "../types/student.types";
import { Select } from "@/components/ui/Select";

interface StudentFiltersProps {
  filters: StudentFiltersState;
  onChange: (filters: StudentFiltersState) => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  filters,
  onChange,
}) => {
  const paymentOptions = [
    { label: "Semua Status Bayar", value: "ALL" },
    { label: "Lunas", value: "Lunas" },
    { label: "DP Terbayar", value: "DP" },
    { label: "Belum Bayar", value: "Belum Bayar" },
  ];

  const visaOptions = [
    { label: "Semua Status Visa", value: "ALL" },
    { label: "Approved (Disetujui)", value: "Approved" },
    { label: "Process (Diproses)", value: "Process" },
    { label: "Pending (Menunggu)", value: "Pending" },
    { label: "Rejected (Ditolak)", value: "Rejected" },
  ];

  const hasActiveFilters =
    filters.search !== "" ||
    filters.paymentStatus !== "ALL" ||
    filters.visaStatus !== "ALL";

  const handleReset = () => {
    onChange({
      search: "",
      paymentStatus: "ALL",
      visaStatus: "ALL",
      packageCategory: "ALL",
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Cari nama jamaah, no. paspor, NIK, kota..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Payment Filter */}
        <div className="sm:col-span-3">
          <Select
            options={paymentOptions}
            value={filters.paymentStatus}
            onChange={(e) =>
              onChange({ ...filters, paymentStatus: e.target.value })
            }
          />
        </div>

        {/* Visa Filter */}
        <div className="sm:col-span-3">
          <Select
            options={visaOptions}
            value={filters.visaStatus}
            onChange={(e) =>
              onChange({ ...filters, visaStatus: e.target.value })
            }
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-emerald-800">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter aktif diterapkan</span>
          </div>
          <button
            onClick={handleReset}
            className="font-semibold text-red-600 hover:underline inline-flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
};
