"use client";

import * as React from "react";
import { fetchLivePackages, Package } from "@/data/packages";
import { PackageCard } from "./PackageCard";

type Status = "loading" | "ready" | "empty";

export const PackagesSection: React.FC = () => {
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [status, setStatus] = React.useState<Status>("loading");

  React.useEffect(() => {
    let active = true;

    fetchLivePackages()
      .then((data) => {
        if (!active) return;
        if (data && data.length > 0) {
          setPackages(data);
          setStatus("ready");
        } else {
          setPackages([]);
          setStatus("empty");
        }
      })
      .catch(() => {
        if (!active) return;
        setPackages([]);
        setStatus("empty");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="paket" className="bg-slate-50 py-16 sm:py-24 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block border border-emerald-600 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            KATALOG PERJALANAN TERBUKA
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Pilihan Paket Umroh &amp; Haji Khusus
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed">
            Transparansi penuh mengenai fasilitas, maskapai penerbangan, hotel
            akomodasi, dan kuota kursi secara real-time.
          </p>
        </div>

        {/* Loading state */}
        {status === "loading" && (
          <div className="flex items-center justify-center gap-3 text-slate-500 mt-16">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            <span className="text-sm">Memuat daftar paket terbaru…</span>
          </div>
        )}

        {/* Empty / error state — no demo/fabricated packages */}
        {status === "empty" && (
          <div className="mx-auto mt-16 max-w-xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Belum ada paket yang tersedia
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Data paket sedang tidak dapat dimuat. Silakan hubungi staf / agen kami
              untuk informasi jadwal dan harga terkini.
            </p>
          </div>
        )}

        {/* Package Grid (3 Columns) */}
        {status === "ready" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 items-stretch">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
