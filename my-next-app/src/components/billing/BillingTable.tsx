"use client";

import * as React from "react";
import { Clock, CheckCircle2, Receipt, RotateCcw } from "lucide-react";
import { InvoiceItem } from "@/app/(dashboard)/tagihan-kasir/page";

export interface BillingTableProps {
  invoices: InvoiceItem[];
  onPay: (invoice: InvoiceItem) => void;
  onCashierRecord: (invoice: InvoiceItem) => void;
  onReceipt: (invoice: InvoiceItem) => void;
  onSync: (invoice: InvoiceItem) => void;
}

export const BillingTable: React.FC<BillingTableProps> = ({
  invoices,
  onPay,
  onCashierRecord,
  onReceipt,
  onSync,
}) => {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
        <p className="text-xs font-semibold text-slate-500">
          Tidak ada tagihan yang sesuai dengan filter atau pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
              <th className="pb-3.5 font-bold">INVOICE &amp; REGISTRASI</th>
              <th className="pb-3.5 font-bold">NAMA JAMAAH &amp; PAKET</th>
              <th className="pb-3.5 font-bold">JATUH TEMPO</th>
              <th className="pb-3.5 font-bold">RINCIAN NOMINAL</th>
              <th className="pb-3.5 font-bold">STATUS</th>
              <th className="pb-3.5 font-bold text-center">AKSI KASIR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {invoices.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition">
                {/* 1. INVOICE & REGISTRASI */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  <p className="font-semibold text-slate-900 font-mono text-[11px]">
                    {item.invoiceNumber}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                        item.typeBadge === "Uang Muka (DP)"
                          ? "bg-sky-50 text-sky-700 border border-sky-200/50"
                          : "bg-purple-50 text-purple-700 border border-purple-200/50"
                      }`}
                    >
                      {item.typeBadge}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.bookingCode}
                    </span>
                  </div>
                </td>

                {/* 2. NAMA JAMAAH & PAKET */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  <p className="font-semibold text-slate-900 uppercase">
                    {item.pilgrimName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.packageName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    HP: {item.phone}
                  </p>
                </td>

                {/* 3. JATUH TEMPO */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{item.dueDate}</span>
                  </div>
                </td>

                {/* 4. RINCIAN NOMINAL */}
                <td className="py-3.5 pr-4 whitespace-nowrap font-mono text-[11px]">
                  <p className="font-bold text-slate-900">
                    Rp {item.totalAmount.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Dibayar: Rp {item.paidAmount.toLocaleString("id-ID")}
                  </p>
                  {item.remainingAmount > 0 && (
                    <p className="text-[10px] text-rose-500 font-semibold">
                      Sisa: Rp {item.remainingAmount.toLocaleString("id-ID")}
                    </p>
                  )}
                </td>

                {/* 5. STATUS BADGE */}
                <td className="py-3.5 pr-4 whitespace-nowrap">
                  {item.status === "Lunas" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Lunas</span>
                    </span>
                  ) : item.status === "Sebagian" ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60">
                      Sebagian
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/60">
                      Belum Bayar
                    </span>
                  )}
                </td>

                {/* 6. AKSI KASIR */}
                <td className="py-3.5 text-center whitespace-nowrap">
                  {item.status === "Lunas" ? (
                    <button
                      onClick={() => onReceipt(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      <Receipt className="h-3 w-3" />
                      <span>Kwitansi</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onPay(item)}
                        className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
                      >
                        Bayar
                      </button>
                      <button
                        onClick={() => onCashierRecord(item)}
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
                      >
                        Catat Kasir
                      </button>
                      <button
                        onClick={() => onSync(item)}
                        title="Sinkronisasi status Midtrans"
                        className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
