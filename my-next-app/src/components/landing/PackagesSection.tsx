"use client";

import * as React from "react";
import { fetchLivePackages, Package, PACKAGES } from "@/data/packages";
import { PackageCard } from "./PackageCard";

export const PackagesSection: React.FC = () => {
  const [packages, setPackages] = React.useState<Package[]>(PACKAGES);

  React.useEffect(() => {
    fetchLivePackages().then((data) => {
      if (data && data.length > 0) {
        setPackages(data);
      }
    });
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
            akomodasi, dan sisa kuota kursi secara real-time.
          </p>
        </div>

        {/* Package Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 items-stretch">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
};
