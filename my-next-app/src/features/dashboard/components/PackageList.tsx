import * as React from "react";
import Image from "next/image";
import { Plane, Building2, Calendar, Users, MapPin, Check } from "lucide-react";
import { PackageItem } from "@/types/database.types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";

interface PackageListProps {
  packages: PackageItem[];
}

export const PackageList: React.FC<PackageListProps> = ({ packages }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Paket Keberangkatan Aktif
          </h2>
          <p className="text-xs text-slate-500">
            Katalog paket umroh dan haji khusus dengan ketersediaan kuota real-time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {packages.map((pkg) => {
          const quotaPercent = Math.round((pkg.bookedSeats / pkg.totalQuota) * 100);

          return (
            <div
              key={pkg.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/90 transition-all hover:shadow-xl hover:border-emerald-700/40"
            >
              {/* Image & Header Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <Image
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  fill
                  className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

                {/* Badge Category */}
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-emerald-950/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                    {pkg.category} • {pkg.durationDays} Hari
                  </span>
                </div>

                {/* Price Tag in Gold */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider block">
                      Mulai Dari
                    </span>
                    <span className="text-2xl font-black text-amber-400 drop-shadow-md">
                      {formatRupiah(pkg.price)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-200 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    All-In Fasilitas
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {pkg.description}
                  </p>
                </div>

                {/* Key Flight & Hotel Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
                  {/* Flight */}
                  <div className="flex items-start gap-2">
                    <Plane className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Maskapai Penerbangan
                      </span>
                      <span className="text-slate-600">{pkg.airline}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Keberangkatan
                      </span>
                      <span className="text-slate-600">
                        {formatDateIndo(pkg.departureDate)}
                      </span>
                    </div>
                  </div>

                  {/* Hotel Makkah */}
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Hotel Makkah
                      </span>
                      <span className="text-slate-600">{pkg.hotelMakkah}</span>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span>{pkg.hotelMakkahDist}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Madinah */}
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        Hotel Madinah
                      </span>
                      <span className="text-slate-600">{pkg.hotelMadinah}</span>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                        <MapPin className="h-3 w-3 text-amber-600" />
                        <span>{pkg.hotelMadinahDist}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seat Quota Progress Bar (Specific Requirement) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Users className="h-4 w-4 text-emerald-700" />
                      <span>Sisa Kuota Kursi:</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      <strong className="text-amber-600">{pkg.availableSeats}</strong> dari{" "}
                      {pkg.totalQuota} Kursi
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-500 transition-all duration-500"
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Terisi {quotaPercent}%</span>
                    <span>{pkg.availableSeats <= 8 ? "🔥 Kuota Menipis" : "Tersedia"}</span>
                  </div>
                </div>

                {/* Features Highlights */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.features.slice(0, 3).map((feat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
