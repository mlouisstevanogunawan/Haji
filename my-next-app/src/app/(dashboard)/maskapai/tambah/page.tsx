"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createFlight } from "@/services/flightService";

export default function TambahMaskapaiPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form Fields
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [flightNumber, setFlightNumber] = React.useState("");
  const [transit, setTransit] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Maskapai wajib diisi!");
      return;
    }
    // airline_code NOT NULL + UNIQUE di database, jadi harus diisi — tidak boleh diisi otomatis.
    if (!code.trim()) {
      showToast("error", "Kode maskapai (IATA) wajib diisi, contoh: EK");
      return;
    }

    setIsSubmitting(true);
    try {
      await createFlight({
        airline_name: name.trim(),
        airline_code: code.trim().toUpperCase(),
        flight_number: flightNumber.trim() || null,
        route: transit.trim() || null,
        is_active: isActive,
      });

      showToast("success", "Maskapai baru berhasil disimpan ke database.");
      setTimeout(() => router.push("/maskapai"), 700);
    } catch (err: unknown) {
      console.error("Gagal menambahkan maskapai:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <Link href="/maskapai" className="hover:text-gray-900 transition">
            Maskapai
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Maskapai</h1>
      </div>

      {/* Card Form */}
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
          {/* Nama Maskapai */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Maskapai <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Emirates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Kode & Nomor Penerbangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: EK"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Penerbangan
              </label>
              <input
                type="text"
                placeholder="Contoh: EK-359"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Transit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transit
            </label>
            <input
              type="text"
              placeholder="Contoh: Transit Dubai"
              value={transit}
              onChange={(e) => setTransit(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Checkbox Aktif */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
              Aktif
            </label>
          </div>
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/maskapai"
            className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm inline-flex items-center justify-center"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
