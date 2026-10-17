"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHotel, HotelCity } from "@/services/hotelService";

// Value harus salah satu enum Postgres public.hotel_city: 'makkah' | 'madinah'.
const CITY_OPTIONS: { value: HotelCity; label: string }[] = [
  { value: "makkah", label: "Mekah" },
  { value: "madinah", label: "Madinah" },
];

export default function SuperAdminTambahHotelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  // Form Fields
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState<HotelCity | "">("");
  const [stars, setStars] = React.useState<string>("4");
  const [distance, setDistance] = React.useState<string>("");
  const [address, setAddress] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [description, setDescription] = React.useState("");
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama Hotel wajib diisi!");
      return;
    }
    // hotels.city NOT NULL dan bertipe enum public.hotel_city, jadi wajib dipilih.
    if (!city) {
      showToast("error", "Silakan pilih Kota (Mekah atau Madinah)!");
      return;
    }

    const starValue = Number(stars);
    if (!Number.isFinite(starValue) || starValue < 1 || starValue > 5) {
      showToast("error", "Bintang hotel harus bernilai antara 1 sampai 5.");
      return;
    }

    const trimmedDistance = distance.trim();
    if (trimmedDistance && !/^\d+$/.test(trimmedDistance)) {
      showToast("error", "Jarak ke Masjid harus berupa angka meter, contoh: 350.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createHotel({
        name: name.trim(),
        city,
        // Satu input bintang, dua kolom yang memang menyimpannya:
        // star_rating numeric(2,1) dan rating integer 1..5 (check constraint).
        star_rating: starValue,
        rating: Math.round(starValue),
        distance_to_haram: trimmedDistance || null,
        address: address.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
      });

      showToast("success", "Hotel baru berhasil disimpan ke database.");
      setTimeout(() => router.push("/hotel"), 700);
    } catch (err: unknown) {
      console.error("Gagal menambahkan hotel:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
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
          <Link href="/hotel" className="hover:text-gray-900 transition">
            Hotel
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Hotel</h1>
      </div>

      {/* Card Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        {notice && (
          <div
            role="status"
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              notice.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {notice.text}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          {/* Nama Hotel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Hotel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Kota & Bintang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as HotelCity | "")}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                <option value="">— Pilih —</option>
                {CITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bintang <span className="text-red-500">*</span>
              </label>
              <select
                value={stars}
                onChange={(e) => setStars(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          {/* Jarak ke Masjid & Checkbox Aktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jarak ke Masjid (meter)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Contoh: 350"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2.5 pb-2.5">
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

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <input
              type="text"
              placeholder="Contoh: Abraj Al-Bait District"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              rows={4}
              placeholder=""
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
            />
          </div>
        </div>

        {/* Tombol Simpan & Batal di bawah */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2 rounded-lg transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/hotel"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-5 py-2 rounded-lg transition shadow-sm"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
