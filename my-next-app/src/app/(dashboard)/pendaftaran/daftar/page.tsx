"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBooking } from "@/services/bookingService";
import { getPackages, PackageRow } from "@/services/packageService";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { getGuides, GuideRow } from "@/services/guideService";

export default function DaftarkanJamaahPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const [pilgrims, setPilgrims] = React.useState<JamaahProfile[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);

  // Form states
  const [selectedPilgrimId, setSelectedPilgrimId] = React.useState("");
  const [selectedPkgId, setSelectedPkgId] = React.useState("");
  const [selectedGuideId, setSelectedGuideId] = React.useState("");
  const [registrationDate, setRegistrationDate] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    // Tanggal daftar default ke hari ini, bukan tanggal hardcode, supaya tidak
    // menjadi tanggal palsu saat halaman dibuka di bulan lain.
    setRegistrationDate(new Date().toISOString().slice(0, 10));
  }, []);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [plgList, pkgList, gdList] = await Promise.all([
          getJamaahList().catch(() => []),
          getPackages().catch(() => []),
          getGuides().catch(() => []),
        ]);
        if (plgList && plgList.length > 0) setPilgrims(plgList);
        if (pkgList && pkgList.length > 0) setPackages(pkgList);
        if (gdList && gdList.length > 0) setGuides(gdList);
      } catch (err) {
        console.error("Gagal memuat opsi data pendaftaran:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilgrimId) {
      showToast("error", "Silakan pilih Jamaah terlebih dahulu!");
      return;
    }
    if (!selectedPkgId) {
      showToast("error", "Silakan pilih Paket terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);
    try {
      const pkg = packages.find((p) => p.id === selectedPkgId);
      if (!pkg || !Number(pkg.price)) {
        // Jangan karang harga: tanpa harga paket, total tagihan tidak bisa dibuat.
        showToast("error", "Harga paket terpilih tidak ditemukan di database.");
        setIsSubmitting(false);
        return;
      }
      await createBooking({
        pilgrim_id: selectedPilgrimId,
        package_id: selectedPkgId,
        guide_id: selectedGuideId || null,
        booking_date: registrationDate || new Date().toISOString().slice(0, 10),
        departure_date: pkg.departure_date || null,
        total_price: Number(pkg.price),
        notes: notes.trim() || null,
        status: "confirmed",
      });

      showToast("success", "Pendaftaran jamaah tersimpan di database.");
      setTimeout(() => router.push("/pendaftaran"), 700);
    } catch (err: unknown) {
      console.error("Gagal mendaftarkan jamaah:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-xl">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/pendaftaran" className="hover:text-gray-900 transition">
            Pendaftaran
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Daftarkan</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Daftarkan Jamaah</h1>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {notice && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm ${
              notice.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {notice.text}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          {/* Jamaah Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jamaah <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPilgrimId}
              onChange={(e) => setSelectedPilgrimId(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            >
              <option value="">— Pilih Jamaah —</option>
              {pilgrims.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone && p.phone !== "-" ? `(${p.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Paket Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            >
              <option value="">— Pilih Paket —</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - Rp {Number(pkg.price).toLocaleString("id-ID")}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Hanya paket berstatus terbuka yang ditampilkan
            </p>
          </div>

          {/* Grid: Pembimbing & Tanggal Daftar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pembimbing (Opsional)
              </label>
              <select
                value={selectedGuideId}
                onChange={(e) => setSelectedGuideId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Tanpa Pembimbing —</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Daftar <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Catatan Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftarkan"}
          </button>
          <Link
            href="/pendaftaran"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer text-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
