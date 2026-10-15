import * as React from "react";
import { Quota } from "@/data/packages";

interface QuotaProgressProps {
  kuota: Quota;
}

export const QuotaProgress: React.FC<QuotaProgressProps> = ({ kuota }) => {
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((kuota.terisi / kuota.total) * 100))
  );

  return (
    <div className="space-y-1.5 my-3 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-normal">Sisa Kuota Kursi</span>
        <span className="text-emerald-600 font-bold">
          {`${kuota.terisi} dari ${kuota.total} Kursi`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
