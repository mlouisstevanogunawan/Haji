"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAnnouncement, AnnouncementAudience } from "@/services/announcementService";
import { getBranches, BranchRecord } from "@/services/branchService";
import { getPackages, PackageRow } from "@/services/packageService";

export default function TambahPengumumanPage() {
  const router = useRouter();

  // Form states
  const [judul, setJudul] = React.useState("");
  const [isi, setIsi] = React.useState("");
  const [audiens, setAudiens] = React.useState<"" | AnnouncementAudience>("");
  const [cabang, setCabang] = React.useState("");
  const [paket, setPaket] = React.useState("");
  const [tayangMulai, setTayangMulai] = React.useState("");
  const [kedaluwarsa, setKedaluwarsa] = React.useState("");
  const [isPublished, setIsPublished] = React.useState(true);

  const [branches, setBranches] = React.useState<BranchRecord[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: "success" | "error"; text: string } | null>(null);

  const showToast = (kind: "success" | "error", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadOptions() {
      try {
        setBranches(await getBranches());
      } catch (err) {
        console.error("Gagal memuat cabang:", err);
      }
      try {
        setPackages(await getPackages());
      } catch (err) {
        console.error("Gagal memuat paket:", err);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      showToast("error", "Judul wajib diisi.");
      return;
    }
    if (!isi.trim()) {
      showToast("error", "Isi Pengumuman wajib diisi.");
      return;
    }
    if (!audiens) {
      showToast("error", "Audiens wajib dipilih.");
      return;
    }

    setIsLoading(true);

    try {
      await createAnnouncement({
        title: judul.trim(),
        content: isi.trim(),
        target_audience: audiens,
        is_published: isPublished,
        published_at: isPublished
          ? tayangMulai
            ? new Date(tayangMulai).toISOString()
            : new Date().toISOString()
          : null,
        branch_id: cabang || null,
        package_id: paket || null,
        expires_at: kedaluwarsa ? new Date(kedaluwarsa).toISOString() : null,
      });

      showToast("success", "Pengumuman berhasil disimpan ke Supabase.");
      setTimeout(() => router.push("/pengumuman"), 700);
    } catch (err: unknown) {
      showToast("error", `Gagal menyimpan pengumuman: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/pengumuman" className="hover:text-gray-900 transition">
            Pengumuman
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Pengumuman</h1>
      </div>

      {notice && (
        <div
          role="status"
          className={`max-w-xl p-3 border rounded-lg text-sm ${
            notice.kind === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Form Container (left aligned ~50-60% width) */}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Detail Pengumuman
          </h2>

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
              placeholder="Contoh: Jadwal Pelunasan Umroh Reguler"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>

          {/* Isi Pengumuman * */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Isi Pengumuman <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Tuliskan isi pengumuman lengkap..."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>

          {/* Audiens * & Cabang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audiens <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={audiens}
                onChange={(e) => setAudiens(e.target.value as AnnouncementAudience)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              >
                <option value="">— Pilih —</option>
                <option value="all">Semua Pengguna</option>
                <option value="jamaah">Jamaah</option>
                <option value="agents">Agen</option>
                <option value="guides">Muthawif / Guide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cabang
              </label>
              <select
                value={cabang}
                onChange={(e) => setCabang(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paket (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paket (opsional)
            </label>
            <select
              value={paket}
              onChange={(e) => setPaket(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="">Semua Paket</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tayang Mulai & Kedaluwarsa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tayang Mulai
              </label>
              <input
                type="datetime-local"
                value={tayangMulai}
                onChange={(e) => setTayangMulai(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kedaluwarsa
              </label>
              <input
                type="datetime-local"
                value={kedaluwarsa}
                onChange={(e) => setKedaluwarsa(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Checkbox Terbitkan */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="terbitkan"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="terbitkan" className="text-sm font-medium text-gray-700 cursor-pointer">
              Terbitkan
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/pengumuman"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
