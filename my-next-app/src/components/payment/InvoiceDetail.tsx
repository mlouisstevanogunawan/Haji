"use client";

import * as React from "react";
import { CheckCircle2, Lock } from "lucide-react";

export interface InvoiceDetailProps {
  invoiceNumber: string;
  pilgrimName: string;
  packageName: string;
  amount: number;
  statusLabel?: string;
  isVerified?: boolean;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoiceNumber,
  pilgrimName,
  packageName,
  amount,
  statusLabel = "Tagihan Sah",
  isVerified = true,
}) => {
  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 sm:p-5 transition-all">
      {/* Top Header: Invoice Number & Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-100/80">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500">Invoice:</span>
          <span className="text-xs font-extrabold text-emerald-900 font-mono tracking-tight">
            {invoiceNumber}
          </span>
        </div>

        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 border border-emerald-300/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            <span>{statusLabel}</span>
          </span>
        )}
      </div>

      {/* Pilgrim & Package Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-emerald-100/80 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Nama Jamaah:
          </span>
          <p className="font-bold text-slate-900 mt-0.5 truncate uppercase">
            {pilgrimName || "-"}
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Paket Umroh/Haji:
          </span>
          <p className="font-semibold text-slate-700 mt-0.5 truncate">
            {packageName || "-"}
          </p>
        </div>
      </div>

      {/* Nominal Terkunci & Large Price Display */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-emerald-900 leading-tight">
              Nominal Pembayaran Terkunci:
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Otomatis terkunci di aplikasi DANA &amp; e-wallet
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
            Rp {amount.toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  );
};
