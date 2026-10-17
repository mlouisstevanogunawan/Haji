"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Edit2,
  Check,
  X,
  CreditCard,
  Users,
  Calendar,
  Building2,
  Plane,
} from "lucide-react";
import { getPackageById, PackageRow } from "@/services/packageService";
import { getBookings } from "@/services/bookingService";
import { getBranches } from "@/services/branchService";

export default function DetailPaketPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params?.id as string;

  const [pkg, setPkg] = React.useState<PackageRow | null>(null);
  const [registeredCount, setRegisteredCount] = React.useState(0);
  const [branchName, setBranchName] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      if (!packageId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getPackageById(packageId);
        setPkg(data);

        const [bookings, branches] = await Promise.all([
          getBookings().catch(() => []),
          getBranches().catch(() => []),
        ]);
        setRegisteredCount(
          bookings.filter((b) => b.package_id === packageId).length
        );
        setBranchName(branches.find((b) => b.id === data?.branch_id)?.name || null);
      } catch (err) {
        console.error("Gagal memuat detail paket:", err);
        setLoadError(`Gagal memuat data paket: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [packageId]);

  const packageName = pkg?.name || (isLoading ? "Memuat..." : "Paket tidak ditemukan");
  const packageCode = pkg?.code || "—";
  const priceVal = Number(pkg?.price || 0);
  const quotaVal = Number(pkg?.quota || 0);
  const remainingQuota = Math.max(0, quotaVal - registeredCount);

  const hotelLine = (prefix: string) =>
    (pkg?.facilities || []).find((f) => f?.startsWith(prefix))?.slice(prefix.length).trim() || "—";

  const fasilitasTermasuk = (pkg?.facilities || []).filter(
    (f) => f && !f.startsWith("Hotel Mekah: ") && !f.startsWith("Hotel Madinah: ")
  );
  const fasilitasTidakTermasuk = pkg?.facilities_excluded || [];

  const formattedDeparture = pkg?.departure_date
    ? new Date(String(pkg.departure_date)).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Belum dijadwalkan";

  const deskripsiTeks = pkg?.description || "Belum ada deskripsi untuk paket ini.";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <Link href="/paket" className="hover:text-gray-900 transition">
              Paket
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{packageName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{packageName}</h1>
            <span className="text-sm text-gray-500 font-mono">{packageCode}</span>
          </div>
        </div>

        {/* Primary Button: Edit */}
        <div>
          <Link
            href={`/paket/tambah?edit=${packageId}`}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
        </div>
      )}

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Harga */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Harga
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            Rp {priceVal.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Pendaftar Aktif */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Pendaftar Aktif
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{registeredCount}</span>
            <span className="text-xs text-gray-500">dari kuota {quotaVal}</span>
          </div>
        </div>

        {/* Sisa Kuota */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Sisa Kuota
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{remainingQuota}</span>
            <span className="text-xs text-gray-500">tersedia</span>
          </div>
        </div>
      </div>

      {/* Grid: Informasi Paket & Akomodasi Transportasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Informasi Paket */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Informasi Paket
          </h2>

          <div className="divide-y divide-gray-100 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Jenis</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {pkg?.type === "haji" ? "Haji" : "Umroh"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {pkg?.is_active ? "Dibuka" : "Ditutup"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Cabang</span>
              <span className="font-medium text-gray-900">{branchName || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Durasi</span>
              <span className="font-medium text-gray-900">
                {Number(pkg?.duration_days || 0)} Hari
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Tanggal Berangkat</span>
              <span className="font-medium text-gray-900">{formattedDeparture}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Kota Keberangkatan</span>
              <span className="font-medium text-gray-900">{pkg?.departure_city || "—"}</span>
            </div>
          </div>
        </div>

        {/* Card: Akomodasi & Transportasi */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Akomodasi &amp; Transportasi
          </h2>

          <div className="divide-y divide-gray-100 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Hotel Mekah</span>
              <span className="font-medium text-gray-900">{hotelLine("Hotel Mekah: ")}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Hotel Madinah</span>
              <span className="font-medium text-gray-900">{hotelLine("Hotel Madinah: ")}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Maskapai</span>
              <span className="font-medium text-gray-900">{pkg?.airline || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Uang Muka</span>
              <span className="font-medium text-gray-900">
                Rp {Number(pkg?.down_payment || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Fasilitas Termasuk & Tidak Termasuk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Fasilitas Termasuk */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Fasilitas Termasuk
          </h2>
          <ul className="space-y-2.5 text-sm text-gray-700">
            {fasilitasTermasuk.length === 0 && (
              <li className="text-gray-400">Belum ada fasilitas yang dicatat.</li>
            )}
            {fasilitasTermasuk.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-green-700 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card: Fasilitas Tidak Termasuk */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Fasilitas Tidak Termasuk
          </h2>
          <ul className="space-y-2.5 text-sm text-gray-700">
            {fasilitasTidakTermasuk.length === 0 && (
              <li className="text-gray-400">Belum ada catatan fasilitas tidak termasuk.</li>
            )}
            {fasilitasTidakTermasuk.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-100 text-red-600 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card: Deskripsi */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Deskripsi
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">{deskripsiTeks}</p>
      </div>
    </div>
  );
}
