import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-slate-50 py-20 md:py-32 overflow-hidden border-b border-slate-100">
      {/* Subtle Dot Grid Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Badge Pill */}
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-emerald-200/60 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Amanah, Resmi, & Berizin Kemenag</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Menuju Baitullah dengan <br />
          <span className="text-emerald-600">Penuh Kekhusyukan &amp;</span> <br />
          <span className="text-emerald-600">Keberkahan</span>
        </h1>

        {/* Subheadline Description */}
        <p className="mt-6 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Pelayanan perjalanan ibadah Umroh dan Haji Khusus bertaraf bintang 5
          dengan bimbingan muthawif berkompeten, hotel dekat Masjidil Haram, dan
          kepastian jadwal keberangkatan.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#paket"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3 rounded-md shadow-sm transition duration-200 text-sm"
          >
            Lihat Paket Tersedia
          </a>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold px-7 py-3 rounded-md transition duration-200 text-sm"
          >
            Portal Staf &amp; Jamaah
          </Link>
        </div>
      </div>
    </section>
  );
};
