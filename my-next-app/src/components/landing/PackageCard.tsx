import * as React from "react";
import Link from "next/link";
import { Clock, Calendar, MapPin, Plane, Building2 } from "lucide-react";
import { Package } from "@/data/packages";
import { formatRupiah } from "@/lib/utils";
import { QuotaProgress } from "./QuotaProgress";
import { FacilitiesList } from "./FacilitiesList";

interface PackageCardProps {
  pkg: Package;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg }) => {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
      {/* Card Header (Gradient Emerald) */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white p-6 rounded-t-xl">
        {/* Top Row: Category + Duration */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded tracking-wide">
            {pkg.kategori}
          </span>
          <div className="flex items-center gap-1 text-amber-300 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{pkg.durasi}</span>
          </div>
        </div>

        {/* Title Paket */}
        <h3 className="text-xl font-bold mt-3 leading-snug">
          {pkg.nama}
        </h3>

        {/* Bottom Row of Header: Mulai dari & Yellow Badge */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-white/80">Mulai dari</span>
          {pkg.badge && (
            <span className="bg-amber-400 text-slate-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              {pkg.badge}
            </span>
          )}
        </div>

        {/* Large Price Display */}
        <div className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {formatRupiah(pkg.harga)}
        </div>
      </div>

      {/* Card Body */}
      <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 flex flex-col justify-between flex-1 space-y-4">
        {/* Detail List */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Keberangkatan: {pkg.keberangkatan}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Embarkasi: {pkg.embarkasi}</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{pkg.maskapai}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Mekah: {pkg.hotelMekah ?? "Belum dicantumkan"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Madinah: {pkg.hotelMadinah ?? "Belum dicantumkan"}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-1">
          {/* Quota Progress Bar */}
          <QuotaProgress kuota={pkg.kuota} />

          {/* Included Facilities List */}
          <FacilitiesList fasilitas={pkg.fasilitas} />
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2.5 text-sm font-semibold transition-colors duration-200 shadow-sm"
          >
            Daftar Melalui Staf / Agen
          </Link>
        </div>
      </div>
    </div>
  );
};
