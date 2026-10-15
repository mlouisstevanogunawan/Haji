"use client";

import * as React from "react";
import { CheckCircle2, Receipt, ArrowRight } from "lucide-react";

export interface PaymentStatusProps {
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  orderId?: string;
  onClose: () => void;
  onViewReceipt?: () => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  invoiceNumber,
  amount,
  paymentMethod,
  orderId,
  onClose,
  onViewReceipt,
}) => {
  return (
    <div className="p-6 text-center space-y-5 animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs border border-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 stroke-[2.2]" />
      </div>

      <div>
        <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
          Transaksi Terverifikasi (Lunas)
        </span>
        <h3 className="text-lg font-bold text-slate-900 mt-2">
          Pembayaran Berhasil!
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Dana telah berhasil kami terima via Midtrans Gateway dan status tagihan telah diperbarui.
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 text-xs font-mono text-left">
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">No. Invoice:</span>
          <span className="font-bold text-slate-800">{invoiceNumber}</span>
        </div>
        {orderId && (
          <div className="flex justify-between">
            <span className="text-slate-400 font-sans">Order ID:</span>
            <span className="text-slate-600 text-[11px] truncate max-w-[180px]">{orderId}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400 font-sans">Metode:</span>
          <span className="text-slate-700 font-medium font-sans">{paymentMethod}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-200/60">
          <span className="text-slate-500 font-sans font-bold">Total Lunas:</span>
          <span className="text-emerald-700 font-extrabold text-sm font-sans">
            Rp {amount.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onViewReceipt && (
          <button
            onClick={onViewReceipt}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-semibold transition"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
            <span>Lihat Kwitansi</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 text-xs font-semibold shadow-xs transition"
        >
          <span>Selesai</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
