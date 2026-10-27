"use client";

import * as React from "react";
import { formatCurrency } from "@/lib/utils";

type StatusBody = {
  order_id: string;
  invoice_found: boolean;
  invoice_number: string | null;
  status: string | null;
  amount: number;
  paid_amount: number;
  remaining: number;
  payment_method: string | null;
  gateway_records: Array<{ transaction_status: string; gross_amount: number }>;
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  partial: "Sebagian dibayar",
  unpaid: "Belum dibayar",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};

/**
 * Menampilkan kondisi tagihan yang sebenarnya di database, bukan apa yang
 * diklaim oleh URL redirect Midtrans. Webhook asynchronous bisa datang beberapa
 * detik setelah halaman ini terbuka, karena itu status dibaca ulang beberapa kali.
 */
export function PaymentStatusPanel({ orderId }: { orderId: string }) {
  const [data, setData] = React.useState<StatusBody | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/invoices/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          if (!cancelled) {
            setError("Sesi login berakhir. Buka dashboard untuk melihat status tagihan.");
            setIsChecking(false);
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as StatusBody;
        if (cancelled) return;
        setData(body);

        const uangMasuk = body.status === "paid" || body.status === "partial";
        if (uangMasuk || attempts >= 5) {
          setIsChecking(false);
        } else {
          setTimeout(check, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        if (attempts >= 5) {
          setError(`Status tidak dapat diambil: ${(err as Error).message}`);
          setIsChecking(false);
        } else {
          setTimeout(check, 2000);
        }
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Status tagihan di database
        </p>
        {isChecking && (
          <span className="text-[11px] font-medium text-slate-400">mengecek...</span>
        )}
      </div>

      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{orderId}</p>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {data && !data.invoice_found && (
        <p className="mt-2 text-sm text-amber-700">
          Nomor tagihan untuk order ini belum ada di database. Pembayaran tidak akan tercatat
          otomatis — hubungi admin dengan menyebut kode di atas.
        </p>
      )}

      {data && data.invoice_found && (
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Tagihan</dt>
          <dd className="text-right font-semibold text-slate-800">{data.invoice_number}</dd>

          <dt className="text-slate-500">Status</dt>
          <dd className="text-right font-semibold text-slate-800">
            {STATUS_LABEL[data.status ?? ""] ?? data.status ?? "-"}
          </dd>

          <dt className="text-slate-500">Nominal tagihan</dt>
          <dd className="text-right font-semibold text-slate-800">
            {formatCurrency(data.amount)}
          </dd>

          <dt className="text-slate-500">Terbayar</dt>
          <dd className="text-right font-semibold text-emerald-700">
            {formatCurrency(data.paid_amount)}
          </dd>

          <dt className="text-slate-500">Sisa</dt>
          <dd className="text-right font-semibold text-slate-800">
            {formatCurrency(data.remaining)}
          </dd>
        </dl>
      )}
    </div>
  );
}
