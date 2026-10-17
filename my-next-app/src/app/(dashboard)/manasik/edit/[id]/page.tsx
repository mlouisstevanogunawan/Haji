"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getManasikSessionById, updateManasikSession } from "@/services/manasikService";
import { getPackages, PackageRow } from "@/services/packageService";
import { getGuides, GuideRow } from "@/services/guideService";

export default function EditJadwalManasikPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "manasik-1";

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);

  // Form states — diisi dari data sesi, bukan contoh tampilan.
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
    async function loadData() {
      setIsLoading(true);
      try {
        const [pkgs, gds] = await Promise.all([
          getPackages().catch(() => []),
          getGuides().catch(() => []),
        ]);
        if (pkgs && pkgs.length > 0) setPackages(pkgs);
        if (gds && gds.length > 0) setGuides(gds);

        // Ambil sesi dari Supabase (lewat proxy service-role)
        const session = await getManasikSessionById(id);

        if (session) {
          setJudul(session.title);
          setTanggal(session.session_date);
          setPaket(session.package_name || "");
          setPembimbing(session.muthawif_name || "");
          setLokasi(session.location || "");
          setDeskripsi(session.notes || "");

          if (session.session_time) {
            const parts = session.session_time.split("-").map((p: string) => p.trim());
            if (parts.length >= 2) {
              setJamMulai(parts[0].replace(" WIB", ""));
              setJamSelesai(parts[1].replace(" WIB", ""));
            } else {
              setJamMulai(session.session_time.replace(" WIB", ""));
            }
          }
        } else {
          showToast("error", "Jadwal manasik dengan ID ini tidak ditemukan di database.");
        }
      } catch (err) {
        console.error("Gagal memuat data jadwal manasik:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

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

      const timeRange = jamMulai && jamSelesai
        ? `${jamMulai} - ${jamSelesai}`
        : jamMulai
        ? jamMulai
        : null;

      await updateManasikSession(id, {
        title: judul.trim(),
        package_id: selectedPkg?.id || null,
        package_name: paket ? (selectedPkg ? selectedPkg.name : paket) : null,
        session_date: tanggal,
        ...(timeRange ? { session_time: timeRange } : {}),
        location: lokasi.trim() || null,
        muthawif_id: selectedGuide?.id || null,
        muthawif_name: pembimbing ? (selectedGuide ? selectedGuide.name : pembimbing) : null,
        notes: deskripsi.trim() || null,
      });

      showToast("success", "Perubahan jadwal manasik tersimpan ke database.");
      setTimeout(() => router.push("/manasik"), 700);
    } catch (err: unknown) {
      console.error("Gagal menyimpan perubahan manasik:", err);
      showToast("error", `Gagal menyimpan perubahan: ${(err as Error).message}`);
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
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Edit Jadwal Manasik</h1>
        <p className="text-sm text-gray-500 mt-0.5">{judul || "Memuat jadwal..."}</p>
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
                {paket && !packages.some((p) => p.name === paket) && (
                  <option value={paket}>{paket}</option>
                )}
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
                {pembimbing && !guides.some((g) => g.name === pembimbing) && (
                  <option value={pembimbing}>{pembimbing}</option>
                )}
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
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
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
