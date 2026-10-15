import * as React from "react";
import { ReportFiltersState } from "../types/report.types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportFiltersProps {
  filters: ReportFiltersState;
  onChange: (filters: ReportFiltersState) => void;
  onReset: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const categoryOptions = [
    { label: "Semua Kategori Paket", value: "ALL" },
    { label: "Umroh Reguler", value: "Reguler" },
    { label: "Umroh Ramadhan", value: "Ramadhan" },
    { label: "Haji Khusus Furoda", value: "Haji Khusus" },
    { label: "Umroh Plus / VIP", value: "VIP" },
  ];

  const paymentTypeOptions = [
    { label: "Semua Jenis Pembayaran", value: "ALL" },
    { label: "DP (Uang Muka)", value: "DP" },
    { label: "Pelunasan", value: "Pelunasan" },
    { label: "Full Payment (Lunas)", value: "Full Payment" },
  ];

  const hasActiveFilters =
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.packageCategory !== "ALL" ||
    filters.paymentType !== "ALL" ||
    Boolean(filters.search);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            label="Pencarian Transaksi"
            placeholder="Cari no transaksi, nama jamaah, paspor..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Start Date */}
        <div>
          <Input
            label="Dari Tanggal"
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              onChange({ ...filters, startDate: e.target.value })
            }
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            label="Sampai Tanggal"
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              onChange({ ...filters, endDate: e.target.value })
            }
          />
        </div>

        {/* Category */}
        <div>
          <Select
            label="Kategori Paket"
            options={categoryOptions}
            value={filters.packageCategory}
            onChange={(e) =>
              onChange({ ...filters, packageCategory: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-100">
        <div>
          <Select
            label="Tipe Setoran"
            options={paymentTypeOptions}
            value={filters.paymentType}
            onChange={(e) =>
              onChange({ ...filters, paymentType: e.target.value })
            }
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-end justify-end pt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Reset Semua Filter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
