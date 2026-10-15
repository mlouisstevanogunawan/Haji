import * as React from "react";
import { BarChart3 } from "lucide-react";

interface SimpleChartProps {
  data: {
    month: string;
    jamaah: number;
    target: number;
  }[];
}

export const SimpleChart: React.FC<SimpleChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => Math.max(d.jamaah, d.target)), 100);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">
              Tren Pendaftaran Jamaah 6 Bulan Terakhir
            </h3>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              1447 - 1448 H
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan realisasi pendaftaran jamaah vs target bulanan
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-700" />
            <span className="text-slate-600 font-medium">Realisasi (Jamaah)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-400" />
            <span className="text-slate-600 font-medium">Target Kuota</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-56 pt-8 pb-2 border-b border-slate-100">
        {data.map((item) => {
          const jamaahHeight = Math.round((item.jamaah / maxVal) * 100);
          const targetHeight = Math.round((item.target / maxVal) * 100);

          return (
            <div key={item.month} className="flex flex-col items-center h-full justify-end group">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-2 py-1 rounded shadow -translate-y-2 whitespace-nowrap z-10 pointer-events-none">
                {item.jamaah} / {item.target} pax
              </div>

              {/* Dual Bars */}
              <div className="flex items-end gap-1 sm:gap-2 w-full justify-center h-full">
                {/* Realized Bar */}
                <div
                  className="w-3.5 sm:w-6 bg-emerald-700 hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                  style={{ height: `${jamaahHeight}%` }}
                />
                {/* Target Bar */}
                <div
                  className="w-3.5 sm:w-6 bg-amber-400 hover:bg-amber-300 rounded-t-md transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                  style={{ height: `${targetHeight}%` }}
                />
              </div>

              {/* Month Label */}
              <span className="mt-3 text-xs font-semibold text-slate-600">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2">
        <span className="flex items-center gap-1.5 font-medium text-emerald-800">
          <BarChart3 className="h-4 w-4" />
          Rata-rata pendaftaran tumbuh 18.5% tiap kloter
        </span>
        <span>Sumber: Sistem Database Terpadu</span>
      </div>
    </div>
  );
};
