"use client";

import * as React from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface InvoiceDetailCardProps {
  invoiceNumber: string;
  pilgrimName: string;
  packageName: string;
  amount: number;
  statusLabel?: string;
  isVerified?: boolean;
}

export const InvoiceDetailCard: React.FC<InvoiceDetailCardProps> = ({
  invoiceNumber,
  pilgrimName,
  packageName,
  amount,
  statusLabel = "Tagihan Sah",
  isVerified = true,
}) => {
  return (
    <div className="relative rounded-2xl border border-slate-200/90 border-l-[5px] border-l-emerald-500 bg-gradient-to-br from-emerald-50/60 via-slate-50/40 to-white p-5 shadow-sm transition-all duration-200 overflow-hidden">
      {/* Top Bar: Invoice Tag + Status Badge */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Invoice
          </span>
          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
            {invoiceNumber}
          </span>
        </div>

        {isVerified && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300/70 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{statusLabel}</span>
          </span>
        )}
      </div>

      {/* Grid 2 Kolom: Jamaah & Paket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-3.5 border-b border-slate-200/70 text-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Nama Jamaah
          </span>
          <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">
            {pilgrimName}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Paket Umroh/Haji
          </span>
          <p className="font-semibold text-slate-700 text-xs sm:text-sm truncate">
            {packageName}
          </p>
        </div>
      </div>

      {/* Bottom Area: Locked Nominal Note & Big Price */}
      <div className="pt-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
            <Lock className="h-3 w-3 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Nominal Terkunci
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              Terkoneksi otomatis ke aplikasi e-wallet &amp; gateway
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Tagihan
          </span>
          <p className="text-[26px] sm:text-[28px] font-bold text-emerald-600 font-mono tabular-nums leading-none mt-0.5">
            {formatCurrency(amount)}
          </p>
        </div>
      </div>
    </div>
  );
};
