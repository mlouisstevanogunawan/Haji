import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export type PaymentResultKind = "success" | "error" | "pending";

const config: Record<
  PaymentResultKind,
  {
    icon: React.ReactNode;
    ring: string;
    badge: string;
    title: string;
    subtitle: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
    ring: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    title: "Pembayaran Berhasil",
    subtitle:
      "Terima kasih, pembayaran Anda telah kami terima. Status tagihan akan otomatis diperbarui.",
  },
  pending: {
    icon: <Clock className="h-10 w-10 text-amber-600" />,
    ring: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    title: "Pembayaran Tertunda",
    subtitle:
      "Transaksi Anda masih dalam proses. Silakan selesaikan pembayaran sesuai instruksi channel yang dipilih.",
  },
  error: {
    icon: <XCircle className="h-10 w-10 text-rose-600" />,
    ring: "bg-rose-50 border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    title: "Pembayaran Gagal",
    subtitle:
      "Pembayaran Anda dibatalkan atau ditolak. Silakan coba lagi atau pilih metode pembayaran lain.",
  },
};

export function PaymentResultView({ kind }: { kind: PaymentResultKind }) {
  const c = config[kind];
  return (
    <div className="min-h-screen w-full bg-[#f8faf9] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-emerald-950/5 text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${c.ring}`}
        >
          {c.icon}
        </div>

        <span
          className={`mt-5 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${c.badge}`}
        >
          {c.title}
        </span>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
          {c.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{c.subtitle}</p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-bold shadow-sm transition active:scale-[0.99]"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-3 text-sm font-semibold transition"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
