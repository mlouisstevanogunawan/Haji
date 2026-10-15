"use client";

import * as React from "react";
import {
  Building,
  Plus,
  Search,
  ChevronDown,
  MapPin,
  Star,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import {
  getHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  HotelRow,
  HotelCity,
} from "@/services/hotelService";

export interface HotelItem {
  id: string;
  name: string;
  city: "Makkah" | "Madinah";
  rating: number; // 3, 4, 5
  distance: string; // e.g. "30 meter", "50 meter"
  distanceMeters: number;
  address: string;
  status: "Aktif" | "Nonaktif";
}

export default function HotelsPage() {
  const [hotels, setHotels] = React.useState<HotelItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [selectedCity, setSelectedCity] = React.useState<"Semua" | "Makkah" | "Madinah">("Semua");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingHotelId, setEditingHotelId] = React.useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState("");
  const [formCity, setFormCity] = React.useState<"Makkah (Haram)" | "Madinah">("Makkah (Haram)");
  const [formRating, setFormRating] = React.useState<number>(4);
  const [formDistance, setFormDistance] = React.useState<string>("100");
  const [formAddress, setFormAddress] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  // Success Notification
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadHotels = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const cityParam = selectedCity === "Semua" ? undefined : (selectedCity.toLowerCase() as HotelCity);
      const data = await getHotels(cityParam);
      const mapped: HotelItem[] = data.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city === "makkah" ? "Makkah" : "Madinah",
        rating: h.rating || 5,
        distance: "50 meter",
        distanceMeters: 50,
        address: h.address || `Kawasan ${h.city}`,
        status: "Aktif",
      }));
      setHotels(mapped);
    } catch (err: any) {
      console.error("Failed to load hotels from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity]);

  React.useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingHotelId(null);
    setFormName("");
    setFormCity("Makkah (Haram)");
    setFormRating(4);
    setFormDistance("100");
    setFormAddress("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (hotel: HotelItem) => {
    setEditingHotelId(hotel.id);
    setFormName(hotel.name);
    setFormCity(hotel.city === "Makkah" ? "Makkah (Haram)" : "Madinah");
    setFormRating(hotel.rating);
    setFormDistance(hotel.distanceMeters.toString());
    setFormAddress(hotel.address);
    setFormIsActive(hotel.status === "Aktif");
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const cityDb: HotelCity = formCity.includes("Makkah") ? "makkah" : "madinah";

    try {
      if (editingHotelId) {
        await updateHotel(editingHotelId, {
          name: formName.trim(),
          city: cityDb,
          rating: formRating,
          address: formAddress.trim(),
        });
        showToast("Data hotel berhasil diperbarui di database!");
      } else {
        await createHotel({
          name: formName.trim(),
          city: cityDb,
          rating: formRating,
          address: formAddress.trim() || `Kawasan ${cityDb}`,
        });
        showToast("Hotel baru berhasil ditambahkan ke database Supabase!");
      }
      setIsModalOpen(false);
      await loadHotels();
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`);
    }
  };

  // Delete Hotel
  const handleDeleteHotel = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}" dari database?`)) {
      try {
        await deleteHotel(id);
        showToast("Hotel berhasil dihapus dari database.");
        await loadHotels();
      } catch (err: any) {
        showToast(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  // Filtered Hotels
  const filteredHotels = hotels.filter((item) => {
    const matchesCity = selectedCity === "Semua" || item.city === selectedCity;
    const q = appliedSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q);

    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-lg animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section (Screenshot 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Building className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Hotel Makkah &amp; Madinah
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manajemen akomodasi hotel di kota suci, rating bintang, dan jarak ke masjid.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Hotel</span>
        </button>
      </div>

      {/* Filter & Search Bar (Screenshot 4) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCity("Semua")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedCity === "Semua"
                ? "bg-slate-900 text-white shadow-xs font-semibold"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            Semua Kota
          </button>
          <button
            onClick={() => setSelectedCity("Makkah")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              selectedCity === "Makkah"
                ? "bg-emerald-800 text-white shadow-xs font-semibold"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <span>🕋</span>
            <span>Makkah</span>
          </button>
          <button
            onClick={() => setSelectedCity("Madinah")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              selectedCity === "Madinah"
                ? "bg-emerald-800 text-white shadow-xs font-semibold"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <span>🕌</span>
            <span>Madinah</span>
          </button>
        </div>

        {/* Search Box & Button */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedSearch(searchQuery);
              }}
              placeholder="Cari nama hotel atau lokasi..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setAppliedSearch(searchQuery)}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 text-xs font-semibold transition cursor-pointer"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Table Data (Screenshot 4) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">HOTEL &amp; RATING</th>
                <th className="pb-3.5 font-bold">KOTA</th>
                <th className="pb-3.5 font-bold">JARAK KE MASJID</th>
                <th className="pb-3.5 font-bold">ALAMAT</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada hotel yang sesuai dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Hotel & Rating */}
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, rIdx) => (
                          <Star key={rIdx} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </td>

                    {/* Kota */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        {item.city === "Makkah" ? (
                          <span className="text-xs">🕋</span>
                        ) : (
                          <span className="text-xs">🕌</span>
                        )}
                        <span>{item.city}</span>
                      </span>
                    </td>

                    {/* Jarak ke Masjid */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{item.distance}</span>
                      </div>
                    </td>

                    {/* Alamat */}
                    <td className="py-3.5 pr-4">
                      <p className="text-slate-600 max-w-xs truncate text-[11px]">
                        {item.address}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      {item.status === "Aktif" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Ubah Hotel"
                          className="p-1 hover:text-emerald-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHotel(item.id, item.name)}
                          title="Hapus"
                          className="p-1 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modal Popup: Tambah / Edit Hotel Baru (Screenshot 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingHotelId ? "Edit Informasi Hotel" : "Tambah Hotel Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi akomodasi hotel di Makkah atau Madinah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              {/* Nama Hotel */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA HOTEL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Swissôtel Al Maqam Makkah"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Kota & Rating Bintang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KOTA <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value as any)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                    >
                      <option value="Makkah (Haram)">Makkah (Haram)</option>
                      <option value="Madinah">Madinah</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    RATING BINTANG
                  </label>
                  <div className="relative">
                    <select
                      value={formRating}
                      onChange={(e) => setFormRating(Number(e.target.value))}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (Bintang 5)</option>
                      <option value={4}>⭐⭐⭐⭐ (Bintang 4)</option>
                      <option value={3}>⭐⭐⭐ (Bintang 3)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Jarak ke Masjid (meter) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  JARAK KE MASJID (METER)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    meter
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Jarak jalan kaki ke pelataran Masjidil Haram atau Masjid Nabawi.
                </p>
              </div>

              {/* Alamat Lengkap / Kawasan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  ALAMAT LENGKAP / KAWASAN
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Contoh: Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Checkbox Hotel Aktif */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Hotel Aktif (Tersedia untuk paket umroh/haji)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {editingHotelId ? "Simpan Perubahan" : "Tambah Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
