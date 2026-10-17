"use client";

import * as React from "react";
import { Plus, Star, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getHotels,
  updateHotel,
  deleteHotel,
  HotelCity,
} from "@/services/hotelService";

export interface HotelItem {
  id: string;
  name: string;
  city: "makkah" | "madinah";
  starRating: number;
  distance: string;
  address: string;
  description: string;
  isActive: boolean;
}

// Label tampilan untuk enum public.hotel_city ('makkah' | 'madinah').
const CITY_LABELS: Record<HotelCity, string> = {
  makkah: "Mekah",
  madinah: "Madinah",
};

export default function SuperAdminHotelPage() {
  const [hotels, setHotels] = React.useState<HotelItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedCity, setSelectedCity] = React.useState<"all" | "makkah" | "madinah">("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Edit Modal State
  const [editingHotel, setEditingHotel] = React.useState<HotelItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCity, setEditCity] = React.useState<"makkah" | "madinah">("makkah");
  const [editRating, setEditRating] = React.useState<string>("4");
  const [editDistance, setEditDistance] = React.useState<string>("");
  const [editAddress, setEditAddress] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);


  const showToast = (kind: "error" | "success", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  const loadHotels = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getHotels(selectedCity === "all" ? undefined : selectedCity);
      const mapped: HotelItem[] = (data || []).map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city === "madinah" ? "madinah" : "makkah",
        starRating: h.star_rating ?? h.rating ?? 0,
        distance: h.distance_to_haram ?? "",
        address: h.address ?? "",
        description: h.description ?? "",
        isActive: h.is_active !== false,
      }));
      setHotels(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load hotels from Supabase:", err);
      setHotels([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity]);

  React.useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  // Kolom distance_to_haram bertipe text dan hanya berisi angka meter.
  const formatDistance = (value: string) => {
    const meters = value.trim();
    return meters ? `${meters} m` : "";
  };

  const handleOpenEdit = (h: HotelItem) => {
    setEditingHotel(h);
    setEditName(h.name);
    setEditCity(h.city);
    setEditRating(String(h.starRating || ""));
    setEditDistance(h.distance.replace(/[^\d]/g, ""));
    setEditAddress(h.address);
    setEditDescription(h.description);
    setEditIsActive(h.isActive);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    if (!editName.trim()) {
      showToast("error", "Nama hotel wajib diisi.");
      return;
    }
    // hotels.city NOT NULL enum: hanya 'makkah' | 'madinah' yang diterima Postgres.
    if (editCity !== "makkah" && editCity !== "madinah") {
      showToast("error", "Kota hotel tidak valid, pilih Mekah atau Madinah.");
      return;
    }
    const starValue = Number(editRating);
    if (!Number.isFinite(starValue) || starValue < 1 || starValue > 5) {
      showToast("error", "Bintang hotel harus bernilai antara 1 sampai 5.");
      return;
    }
    const meters = editDistance.trim();
    if (meters && !/^\d+$/.test(meters)) {
      showToast("error", "Jarak ke Masjid harus berupa angka meter, contoh: 350.");
      return;
    }

    setIsSaving(true);
    try {
      await updateHotel(editingHotel.id, {
        name: editName.trim(),
        city: editCity,
        star_rating: starValue,
        rating: Math.round(starValue),
        distance_to_haram: meters || null,
        address: editAddress.trim() || null,
        description: editDescription.trim() || null,
        is_active: editIsActive,
      });
      setEditingHotel(null);
      await loadHotels();
      showToast("success", "Data hotel berhasil diperbarui di Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui hotel:", err);
      showToast("error", `Gagal menyimpan ke Supabase: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      try {
        await deleteHotel(id);
        await loadHotels();
        showToast("success", "Hotel berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus hotel:", err);
        showToast("error", `Gagal menghapus hotel: ${(err as Error).message}`);
      }
    }
  };

  // Filtered hotels
  const filteredHotels = hotels.filter((item) => {
    const matchesCity = selectedCity === "all" || item.city === selectedCity;
    const q = appliedSearch;
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q) ||
      CITY_LABELS[item.city].toLowerCase().includes(q);

    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.kind === "error"
              ? "bg-red-600 text-white"
              : "bg-slate-900 text-white"
          }`}
        >
          <CheckCircle2
            className={`h-4 w-4 ${toast.kind === "error" ? "text-white" : "text-emerald-400"}`}
          />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header section with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Hotel</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Hotel</h1>
          <p className="text-sm text-gray-500">Daftar hotel Mekah &amp; Madinah</p>
        </div>

        <div>
          <Link
            href="/super-admin/hotel/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Hotel</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Cari nama hotel..."
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm w-60 sm:w-72"
        />

        {/* Kota Filter */}
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value as "all" | "makkah" | "madinah")}
          className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
        >
          <option value="all">Semua Kota</option>
          <option value="makkah">Mekah</option>
          <option value="madinah">Madinah</option>
        </select>

        {/* Cari Button */}
        <button
          onClick={handleSearch}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table Data Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  HOTEL
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KOTA
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BINTANG
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JARAK KE MASJID
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Memuat data hotel dari Supabase...
                  </td>
                </tr>
              ) : filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">
                    {loadError
                      ? `Gagal memuat data hotel dari Supabase: ${loadError}`
                      : "Belum ada hotel tersimpan di Supabase."}
                  </td>
                </tr>
              ) : (
                filteredHotels.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    {/* Hotel Name */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.name}
                    </td>

                    {/* Kota */}
                    <td className="px-6 py-4 text-gray-600">
                      {CITY_LABELS[item.city]}
                    </td>

                    {/* Bintang */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-yellow-400">
                        {Array.from({ length: item.starRating }).map((_, rIdx) => (
                          <Star
                            key={rIdx}
                            className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </td>

                    {/* Jarak ke Masjid */}
                    <td className="px-6 py-4 text-gray-600">
                      {formatDistance(item.distance) || (
                        <span className="text-gray-400">Belum diisi</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3 justify-end">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Hotel */}
      {editingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Hotel</h3>
              <button
                type="button"
                onClick={() => setEditingHotel(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Hotel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kota <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value as HotelCity)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                  >
                    <option value="makkah">Mekah</option>
                    <option value="madinah">Madinah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bintang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm cursor-pointer"
                  >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jarak ke Masjid (meter)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Contoh: 350"
                  value={editDistance}
                  onChange={(e) => setEditDistance(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Abraj Al-Bait District"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm resize-y"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label
                  htmlFor="editIsActive"
                  className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                >
                  Aktif
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHotel(null)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
