"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { createEquipmentAssignment } from "@/services/equipmentService";

const ITEM_OPTIONS = [
  "Koper 24 inch",
  "Koper 20 inch",
  "Kain Ihram",
  "Mukena & Bergo",
  "Seragam Batik",
  "Tas Paspor & Dokumen",
  "Buku Doa & Tasbih",
  "Jaket / Rompi",
];

export default function TambahPerlengkapanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [jamaahList, setJamaahList] = React.useState<{ id: string; name: string }[]>([]);
  const [isLoadingJamaah, setIsLoadingJamaah] = React.useState(true);
  const [jamaahError, setJamaahError] = React.useState<string | null>(null);

  // Form states
  const [jamaah, setJamaah] = React.useState("");
  const [item, setItem] = React.useState("");
  const [ukuran, setUkuran] = React.useState("");
  const [jumlah, setJumlah] = React.useState(1);
  const [status, setStatus] = React.useState("Belum Disiapkan");
  const [tanggalDiserahkan, setTanggalDiserahkan] = React.useState("");
  const [catatan, setCatatan] = React.useState("");
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const loadData = React.useCallback(async () => {
    setIsLoadingJamaah(true);
    setJamaahError(null);
    try {
      const list: JamaahProfile[] = await getJamaahList();
      setJamaahList((list || []).map((j) => ({ id: j.id, name: j.name })));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat daftar jamaah:", err);
      setJamaahList([]);
      setJamaahError(msg);
    } finally {
      setIsLoadingJamaah(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jamaah || !item) {
      showToast("error", "Jamaah dan Item perlengkapan wajib dipilih!");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedJamaah = jamaahList.find((j) => j.id === jamaah || j.name === jamaah);
      if (!selectedJamaah) {
        showToast("error", "Jamaah terpilih tidak ditemukan di data Supabase.");
        setIsSubmitting(false);
        return;
      }

      const isDelivered = status === "Sudah Diserahkan";

      await createEquipmentAssignment({
        pilgrim_id: selectedJamaah.id,
        pilgrim_name: selectedJamaah.name,
        item_name: item,
        quantity: jumlah,
        condition: "good",
        size: ukuran.trim() || null,
        is_delivered: isDelivered,
        delivered_at: isDelivered && tanggalDiserahkan ? tanggalDiserahkan : null,
        notes: catatan.trim() || null,
      });

      showToast("success", "Perlengkapan jamaah berhasil disimpan ke Supabase.");
      setTimeout(() => router.push("/perlengkapan"), 700);
    } catch (err: unknown) {
      console.error("Gagal menyimpan perlengkapan:", err);
      showToast("error", `Gagal menyimpan perlengkapan: ${(err as Error).message}`);
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
          <Link href="/perlengkapan" className="hover:text-gray-900 transition">
            Perlengkapan
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Perlengkapan</h1>
      </div>

      {/* Form Container (left 50-60%) */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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
          {/* Jamaah * */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jamaah <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={jamaah}
              onChange={(e) => setJamaah(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            >
              <option value="">
                {isLoadingJamaah
                  ? "— Memuat jamaah… —"
                  : jamaahList.length === 0
                  ? "— Belum ada jamaah di Supabase —"
                  : "— Pilih —"}
              </option>
              {jamaahList.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
            {jamaahError && (
              <p className="text-xs text-red-600 mt-1">
                Gagal memuat daftar jamaah dari Supabase: {jamaahError}
              </p>
            )}
            {!jamaahError && !isLoadingJamaah && jamaahList.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Tidak ada jamaah di Supabase. Daftarkan jamaah terlebih dahulu.
              </p>
            )}
          </div>

          {/* Item & Ukuran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="">— Pilih —</option>
                {ITEM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ukuran
              </label>
              <input
                type="text"
                value={ukuran}
                onChange={(e) => setUkuran(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Jumlah & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={jumlah}
                onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Belum Disiapkan">Belum Disiapkan</option>
                <option value="Disiapkan">Disiapkan</option>
                <option value="Sudah Diserahkan">Sudah Diserahkan</option>
              </select>
            </div>
          </div>

          {/* Tanggal Diserahkan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Diserahkan
            </label>
            <input
              type="date"
              value={tanggalDiserahkan}
              onChange={(e) => setTanggalDiserahkan(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
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
            onClick={() => router.push("/perlengkapan")}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
