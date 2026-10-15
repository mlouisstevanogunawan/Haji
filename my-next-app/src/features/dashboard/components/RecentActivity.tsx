import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Pilgrim } from "@/types/database.types";
import { formatDateShort, formatRupiah } from "@/lib/utils";

interface RecentActivityProps {
  pilgrims: Pilgrim[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ pilgrims }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Pendaftaran Jamaah Terkini
          </h3>
          <p className="text-xs text-slate-500">
            5 jamaah terbaru yang baru mendaftar atau mengupdate dokumen
          </p>
        </div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          Lihat Semua Jamaah
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {pilgrims.map((p) => {
          return (
            <div
              key={p.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {p.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {p.fullName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {p.passportNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.packageName} • {formatDateShort(p.registrationDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs font-bold text-slate-800">
                  {formatRupiah(p.totalPaid)}
                </span>

                {p.paymentStatus === "Lunas" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Lunas
                  </span>
                ) : p.paymentStatus === "DP" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    <Clock className="h-3 w-3" />
                    DP Terbayar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                    <AlertCircle className="h-3 w-3" />
                    Belum Bayar
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
