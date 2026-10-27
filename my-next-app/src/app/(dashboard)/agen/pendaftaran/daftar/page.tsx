"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getPackages, PackageRow } from "@/services/packageService";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { getGuides, GuideRow } from "@/services/guideService";
import { createBooking } from "@/services/bookingService";

export default function DaftarkanJamaahAgenPage() {
  const router = useRouter();


  // Form state — setiap select menyimpan ID baris asli dari database, bukan nama.
  const [selectedJamaah, setSelectedJamaah] = React.useState("");
  const [selectedPaket, setSelectedPaket] = React.useState("");
  const [selectedGuide, setSelectedGuide] = React.useState("");
  const [tanggalDaftar, setTanggalDaftar] = React.useState("");
  const [catatan, setCatatan] = React.useState("");

  // Daftar opsi dimulai KOSONG: tidak ada baris contoh/fiktif. Bila Supabase
  // lambat atau gagal, pengguna hanya melihat status Muat / Belum ada data.
  const [jamaahOptions, setJamaahOptions] = React.useState<JamaahProfile[]>([]);
  const [packageOptions, setPackageOptions] = React.useState<PackageRow[]>([]);
  const [guideOptions, setGuideOptions] = React.useState<GuideRow[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = React.useState(true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Tanggal daftar diisi saat runtime (bukan literal hardcode) supaya default
  // selalu "hari ini" dan tidak memicu mismatch hidrasi server/klien.
  React.useEffect(() => {
    setTanggalDaftar(new Date().toISOString().slice(0, 10));
  }, []);

  // Muat opsi nyata dari service.
  React.useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setIsLoadingOptions(true);
      const [pkgs, pilgrims, guides] = await Promise.allSettled([
        getPackages(),
        getJamaahList(),
        getGuides(),
      ]);
      if (cancelled) return;
      if (pkgs.status === "fulfilled") setPackageOptions(pkgs.value || []);
      if (pilgrims.status === "fulfilled") setJamaahOptions(pilgrims.value || []);
      if (guides.status === "fulfilled") setGuideOptions(guides.value || []);
      setIsLoadingOptions(false);
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!selectedJamaah) {
      setNotice({ kind: "error", text: "Silakan pilih Jamaah." });
      return;
    }
    if (!selectedPaket) {
      setNotice({ kind: "error", text: "Silakan pilih Paket." });
      return;
    }

    const pkg = packageOptions.find((p) => p.id === selectedPaket);
    if (!pkg || !Number(pkg.price)) {
      // Jangan karang harga: tanpa harga paket nyata, total tagihan tidak dibuat.
      setNotice({ kind: "error", text: "Harga paket terpilih tidak ditemukan di database." });
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        pilgrim_id: selectedJamaah,
        package_id: pkg.id,
        guide_id: selectedGuide || null,
        booking_date: tanggalDaftar || new Date().toISOString().slice(0, 10),
        departure_date: pkg.departure_date || null,
        total_price: Number(pkg.price),
        notes: catatan.trim() || null,
        status: "pending",
      });

      setNotice({ kind: "success", text: "Pendaftaran jamaah tersimpan di database." });
      setTimeout(() => router.push("/agen/pendaftaran"), 700);
    } catch (err: unknown) {
      console.error("Gagal mendaftarkan jamaah:", err);
      setNotice({ kind: "error", text: `Gagal menyimpan ke Supabase: ${(err as Error).message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/agen/dashboard" className="hover:text-gray-600 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/agen/pendaftaran" className="hover:text-gray-600 transition">
            Pendaftaran
          </Link>
          <span>&gt;</span>
          <span className="text-gray-500 font-medium">Daftarkan</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daftarkan Jamaah</h1>
      </div>

      {notice && (
        <div
          role="status"
          className={`max-w-xl rounded-lg border px-4 py-3 text-sm ${
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Form Card on the left (~50-60% width) */}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          {/* Jamaah * */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jamaah <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={selectedJamaah}
                onChange={(e) => setSelectedJamaah(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
              >
                <option value="">{isLoadingOptions ? "— Memuat… —" : "— Pilih Jamaah —"}</option>
                {jamaahOptions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
                {!isLoadingOptions && jamaahOptions.length === 0 && (
                  <option value="" disabled>
                    — Belum ada data —
                  </option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Paket * */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Paket <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={selectedPaket}
                onChange={(e) => setSelectedPaket(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
              >
                <option value="">{isLoadingOptions ? "— Memuat… —" : "— Pilih Paket —"}</option>
                {packageOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - Rp {Number(p.price).toLocaleString("id-ID")}
                  </option>
                ))}
                {!isLoadingOptions && packageOptions.length === 0 && (
                  <option value="" disabled>
                    — Belum ada data —
                  </option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Hanya paket berstatus terbuka yang ditampilkan.
            </p>
          </div>

          {/* Pembimbing (Opsional) & Tanggal Daftar * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pembimbing (Opsional)
              </label>
              <div className="relative">
                <select
                  value={selectedGuide}
                  onChange={(e) => setSelectedGuide(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3.5 py-2 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
                >
                  <option value="">— Tanpa Pembimbing —</option>
                  {guideOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                  {!isLoadingOptions && guideOptions.length === 0 && (
                    <option value="" disabled>
                      — Belum ada data —
                    </option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tanggal Daftar <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggalDaftar}
                onChange={(e) => setTanggalDaftar(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftarkan"}
          </button>
          <Link
            href="/agen/pendaftaran"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
