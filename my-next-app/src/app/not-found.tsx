import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8faf9] px-4 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-950 text-amber-400 shadow-2xl shadow-emerald-950/20">
          <Compass className="h-12 w-12 stroke-[1.8] animate-spin" style={{ animationDuration: "12s" }} />
        </div>
      </div>
      <span className="text-sm font-bold uppercase tracking-widest text-emerald-800">
        Error 404 - Halaman Tidak Ditemukan
      </span>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Arah Kiblat Halaman Ini Belum Terhubung
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        Maaf, tautan atau rute yang Anda tuju tidak ditemukan atau telah dipindahkan ke modul baru.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard">
          <Button variant="default" className="gap-2">
            <Home className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
