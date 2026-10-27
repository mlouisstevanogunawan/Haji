"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type InvoiceStatusBlock = {
  invoice_found: boolean;
  invoice_number: string | null;
  status: string | null;
  amount: number;
  paid_amount: number;
  remaining: number;
  payment_method: string | null;
};

type VerifyResponse = {
  verified: boolean;
  order_id: string;
  endpoint?: string;
  message?: string;
  error?: string;
  error_code?: string;
  gateway?: {
    transaction_status: string;
    fraud_status: string | null;
    payment_type: string;
    gross_amount: string;
    settlement_time: string | null;
  };
  invoice?: InvoiceStatusBlock;
};

const INVOICE_LABEL: Record<string, string> = {
  paid: "Lunas",
  partial: "Sebagian dibayar",
  unpaid: "Belum dibayar",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};

const MAX_AUTO_CHECKS = 4;
const RETRY_MS = 3000;

/**
 * Panel status pada halaman hasil pembayaran.
 *
 * Angka yang ditampilkan bukan dari query string Midtrans, melainkan hasil
 * backend menanyakan transaksi ke Midtrans Status API lalu membaca tagihannya
 * kembali setelah ditulis. Selama Midtrans masih menjawab "pending" (VA/QRIS
 * bisa perlu beberapa menit) panel cek ulang otomatis beberapa kali, lalu
 * meninggalkan tombol untuk mengecek manual.
 */
export function PaymentStatusPanel({
  orderId,
  transactionId,
}: {
  orderId: string;
  transactionId?: string;
}) {
  const [data, setData] = React.useState<VerifyResponse | null>(null);
  const [httpStatus, setHttpStatus] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);

  const runCheck = React.useCallback(
    async (attempt: number) => {
      setIsChecking(true);
      try {
        const res = await fetch("/api/payment/verify-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ order_id: orderId, transaction_id: transactionId ?? null }),
        });
        const body = (await res.json()) as VerifyResponse & { error?: string };
        setHttpStatus(res.status);

        if (res.status === 401) {
          setError("Sesi login berakhir. Buka dashboard untuk melihat status tagihan.");
          setIsChecking(false);
          return;
        }
        if (!res.ok && res.status !== 404) {
          setError(body.error || body.message || `Gagal memeriksa status (HTTP ${res.status}).`);
          setData(body.invoice ? body : null);
          setIsChecking(false);
          return;
        }

        setData(body);

        const sudahAdaUang =
          body.invoice?.status === "paid" || body.invoice?.status === "partial";
        if (sudahAdaUang || attempt >= MAX_AUTO_CHECKS) {
          setIsChecking(false);
        } else {
          setTimeout(() => void runCheck(attempt + 1), RETRY_MS);
        }
      } catch (err) {
        setError(`Status tidak dapat diambil: ${(err as Error).message}`);
        setIsChecking(false);
      }
    },
    [orderId, transactionId]
  );

  React.useEffect(() => {
    void runCheck(1);
  }, [runCheck]);

  const invoice = data?.invoice;
  const gateway = data?.gateway;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Status tagihan (dicek ke Midtrans)
        </p>
        <button
          type="button"
          onClick={() => void runCheck(1)}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Mengecek..." : "Cek ulang"}
        </button>
      </div>

      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{orderId}</p>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {gateway && (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          Midtrans: <span className="font-semibold text-slate-800">{gateway.transaction_status}</span>
          {gateway.fraud_status ? ` / ${gateway.fraud_status}` : ""}
          {gateway.payment_type ? ` • ${gateway.payment_type}` : ""}
          {data?.message ? ` — ${data.message}` : ""}
        </p>
      )}

      {data && !data.verified && !error && (
        <p className="mt-2 text-sm text-amber-700">
          {data.message ||
            "Status belum bisa dipastikan. Pembayaran akan tercatat begitu Midtrans mengonfirmasi."}
        </p>
      )}

      {invoice && !invoice.invoice_found && (
        <p className="mt-2 text-sm text-amber-700">
          Nomor tagihan untuk order ini belum ada di database. Pembayaran tidak dapat
          ditautkan — hubungi admin dengan menyebut kode di atas.
        </p>
      )}

      {invoice && invoice.invoice_found && (
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Tagihan</dt>
          <dd className="text-right font-semibold text-slate-800">{invoice.invoice_number}</dd>

          <dt className="text-slate-500">Status</dt>
          <dd className="text-right font-semibold text-slate-800">
            {INVOICE_LABEL[invoice.status ?? ""] ?? invoice.status ?? "-"}
          </dd>

          <dt className="text-slate-500">Nominal tagihan</dt>
          <dd className="text-right font-semibold text-slate-800">
            {formatCurrency(invoice.amount)}
          </dd>

          <dt className="text-slate-500">Terbayar</dt>
          <dd className="text-right font-semibold text-emerald-700">
            {formatCurrency(invoice.paid_amount)}
          </dd>

          <dt className="text-slate-500">Sisa</dt>
          <dd className="text-right font-semibold text-slate-800">
            {formatCurrency(invoice.remaining)}
          </dd>

          {invoice.payment_method && (
            <>
              <dt className="text-slate-500">Metode</dt>
              <dd className="text-right font-semibold text-slate-800">{invoice.payment_method}</dd>
            </>
          )}
        </dl>
      )}

      {httpStatus !== null && !isChecking && (
        <p className="mt-3 text-[10px] text-slate-400">
          Pemeriksaan terakhir: HTTP {httpStatus}
          {data?.endpoint ? ` via ${data.endpoint}` : ""}
        </p>
      )}
    </div>
  );
}
