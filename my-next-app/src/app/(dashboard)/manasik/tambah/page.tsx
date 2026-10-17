"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createManasikSession } from "@/services/manasikService";
import { getPackages, PackageRow } from "@/services/packageService";
import { getGuides, GuideRow } from "@/services/guideService";

export default function TambahJadwalManasikPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);

  // Form states
  const [judul, setJudul] = React.useState("");
  const [paket, setPaket] = React.useState("");
  const [pembimbing, setPembimbing] = React.useState("");
  const [tanggal, setTanggal] = React.useState("");
  const [lokasi, setLokasi] = React.useState("");
  const [jamMulai, setJamMulai] = React.useState("");
  const [jamSelesai, setJamSelesai] = React.useState("");
  const [deskripsi, setDeskripsi] = React.useState("");

  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);
  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadOptions() {
      try {
        const pkgs = await getPackages();
        if (pkgs && pkgs.length > 0) {
          setPackages(pkgs);
        }
      } catch (err) {
        console.error("Gagal memuat paket:", err);
      }

      try {
        const gds = await getGuides();
        if (gds && gds.length > 0) {
          setGuides(gds);
        }
      } catch (err) {
        console.error("Gagal memuat pembimbing:", err);
      }
    }

    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !tanggal) {
      showToast("error", "Judul sesi dan tanggal manasik wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPkg = packages.find((p) => p.name === paket || p.id === paket);
      const selectedGuide = guides.find((g) => g.name === pembimbing || g.id === pembimbing);

      let timeRange: string | null = null;
      if (jamMulai && jamSelesai) timeRange = `${jamMulai} - ${jamSelesai}`;
      else if (jamMulai) timeRange = jamMulai;

      await createManasikSession({
        title: judul.trim(),
        package_id: selectedPkg?.id || null,
        package_name: paket ? (selectedPkg ? selectedPkg.name : paket) : null,
        session_date: tanggal,
        // Bila jam tidak diisi, kolom punya default di database.
        ...(timeRange ? { session_time: timeRange } : {}),
        location: lokasi.trim() || null,
        muthawif_id: selectedGuide?.id || null,
        muthawif_name: pembimbing ? (selectedGuide ? selectedGuide.name : pembimbing) : null,
        notes: deskripsi.trim() || null,
      });

      showToast("success", "Jadwal manasik tersimpan ke database.");
      setTimeout(() => router.push("/manasik"), 700);
    } catch (err: unknown) {
      console.error("Gagal menyimpan jadwal manasik:", err);
      showToast("error", `Gagal menyimpan jadwal manasik: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/manasik" className="hover:text-gray-900 transition">
            Manasik
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Jadwal Manasik</h1>
      </div>

      {/* Form Container (left 50-60%) */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {notice && (
          <div
            role="alert"
            className={`rounded-lg border px-4 py-3 text-sm ${
              notice.kind === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-teal-50 border-teal-200 text-teal-800"
            }`}
          >
            {notice.text}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          {/* Judul * */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Paket & Pembimbing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paket
              </label>
              <select
                value={paket}
                onChange={(e) => setPaket(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Umum (semua jamaah) —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Kosongkan untuk manasik umum cabang</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pembimbing
              </label>
              <select
                value={pembimbing}
                onChange={(e) => setPembimbing(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Tanpa pembimbing —</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Jam Mulai & Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/manasik")}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
