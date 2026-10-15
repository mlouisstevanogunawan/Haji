"use client";

import * as React from "react";
import {
  Package,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  Building2,
  Plane,
  Eye,
  Edit2,
  Trash2,
  Users,
  ArrowLeft,
  Check,
} from "lucide-react";

import {
  getPackages,
  createPackage,
  deletePackage,
  PackageRow,
  PackageType,
} from "@/services/packageService";
import { getHotels } from "@/services/hotelService";
import { getFlights } from "@/services/flightService";

interface PackageItem {
  id: string;
  name: string;
  duration: string;
  branch: string;
  type: "Umroh" | "Haji";
  price: string;
  bookedSeats: number;
  totalSeats: number;
  departureDate: string;
  departureCity: string;
  hotel: string;
  airline: string;
  status: "Published" | "Draft" | "Penuh";
}

export default function PaketTersediaPage() {
  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("Semua Jenis");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [isAdding, setIsAdding] = React.useState(false);

  // Form states matching Screenshot 2
  const [formName, setFormName] = React.useState("");
  const [formBranch, setFormBranch] = React.useState("Cabang Bandung (CAB-BDG)");
  const [formType, setFormType] = React.useState<"Umroh" | "Haji">("Umroh");
  const [formPrice, setFormPrice] = React.useState("30000000");
  const [formStatus, setFormStatus] = React.useState("Draft (Disimpan Sementara)");
  const [formSeats, setFormSeats] = React.useState("45");
  const [formDuration, setFormDuration] = React.useState("9");

  const [formDepartDate, setFormDepartDate] = React.useState("");
  const [formReturnDate, setFormReturnDate] = React.useState("");
  const [formDepartCity, setFormDepartCity] = React.useState("Jakarta");
  const [formHotelMekah, setFormHotelMekah] = React.useState("-- Pilih Hotel Mekah --");
  const [formHotelMadinah, setFormHotelMadinah] = React.useState("-- Pilih Hotel Madinah --");
  const [formAirline, setFormAirline] = React.useState("-- Pilih Maskapai Penerbangan --");

  const [formIncluded, setFormIncluded] = React.useState(
    "Tiket Pesawat PP\nHotel Makkah & Madinah\nVisa Umroh\nMakan 3x Sehari\nTransportasi Bus AC"
  );
  const [formExcluded, setFormExcluded] = React.useState(
    "Paspor\nVaksin Meningitis\nPengeluaran Pribadi / Laundry\nKelebihan Bagasi"
  );

  // Dynamic options from hotels & airlines management
  const [makkahHotels, setMakkahHotels] = React.useState<string[]>([
    "Swissôtel Al Maqam Makkah",
    "Pullman Zamzam Makkah",
    "Hilton Suites Makkah",
  ]);
  const [madinahHotels, setMadinahHotels] = React.useState<string[]>([
    "Dar Al Taqwa Hotel Madinah",
    "Madinah Hilton Hotel",
    "Dallah Taibah Hotel",
  ]);
  const [airlineOptions, setAirlineOptions] = React.useState<string[]>([
    "Saudia Airlines",
    "Garuda Indonesia",
    "Emirates",
    "Qatar Airways",
  ]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const typeParam = typeFilter === "Umroh" ? "umroh" : typeFilter === "Haji" ? "haji" : undefined;
      const data = await getPackages(typeParam as PackageType);
      const mapped: PackageItem[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        duration: `${p.duration_days} Hari`,
        branch: "Kantor Pusat Jakarta",
        type: p.type === "haji" ? "Haji" : "Umroh",
        price: `Rp ${Number(p.price).toLocaleString("id-ID")}`,
        bookedSeats: 0,
        totalSeats: p.quota,
        departureDate: p.created_at?.split("T")[0] || "15 Des 2026",
        departureCity: "Jakarta",
        hotel: "Hotel Bintang 5 Dekat Masjid",
        airline: "Maskapai Resmi",
        status: p.is_active ? "Published" : "Draft",
      }));
      setPackages(mapped);

      // Load dynamic hotels and flights
      const [hotelsList, flightsList] = await Promise.all([
        getHotels().catch(() => []),
        getFlights().catch(() => []),
      ]);

      const mHotels = hotelsList.filter((h) => h.city === "makkah").map((h) => h.name);
      const madHotels = hotelsList.filter((h) => h.city === "madinah").map((h) => h.name);
      const airList = flightsList.map((f) => f.airline_name);

      if (mHotels.length > 0) setMakkahHotels(Array.from(new Set([...mHotels, ...makkahHotels])));
      if (madHotels.length > 0) setMadinahHotels(Array.from(new Set([...madHotels, ...madinahHotels])));
      if (airList.length > 0) setAirlineOptions(Array.from(new Set([...airList, ...airlineOptions])));
    } catch (err: any) {
      console.error("Failed to load packages from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      await createPackage({
        name: formName,
        type: formType.toLowerCase() as PackageType,
        price: Number(formPrice) || 30000000,
        duration_days: Number(formDuration) || 9,
        quota: Number(formSeats) || 45,
        facilities: formIncluded.split("\n").filter(Boolean),
        description: `Paket ${formType} keberangkatan ${formDepartCity}`,
        is_active: !formStatus.includes("Draft"),
      });

      setIsAdding(false);
      setFormName("");
      await loadData();
    } catch (err: any) {
      alert(`Gagal membuat paket: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus paket perjalanan ini dari database?")) {
      try {
        await deletePackage(id);
        await loadData();
      } catch (err: any) {
        alert(`Gagal menghapus paket: ${err.message}`);
      }
    }
  };

  const filteredPackages = packages.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // If in Add Mode, show EXACT form from Screenshot 1
  if (isAdding) {
    return (
      <div className="space-y-6 pb-16 max-w-4xl mx-auto">
        <form onSubmit={handleCreatePackage} className="space-y-6 text-xs">
          {/* Section 1: Informasi Dasar Paket */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <span>Informasi Dasar Paket</span>
            </h3>

            {/* Nama Paket */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                NAMA PAKET PERJALANAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Paket Umroh Syawal Bintang 5 Plus Turki 12 Hari"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Kantor Cabang & Jenis Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KANTOR CABANG PENGELOLA <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>Cabang Bandung (CAB-BDG)</option>
                    <option>Kantor Pusat Jakarta</option>
                    <option>Cabang Surabaya (CAB-SBY)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  JENIS PROGRAM <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option value="Umroh">Umroh</option>
                    <option value="Haji">Haji</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Harga Paket & Status Publikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  HARGA PAKET (RP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  STATUS PUBLIKASI <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>Draft (Disimpan Sementara)</option>
                    <option>Published (Publikasikan Langsung)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Kuota Jamaah & Durasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KUOTA JAMAAH (KURSI) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={formSeats}
                    onChange={(e) => setFormSeats(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  DURASI PROGRAM (HARI) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Keberangkatan & Akomodasi */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plane className="h-4 w-4 text-emerald-600" />
              <span>Keberangkatan &amp; Akomodasi</span>
            </h3>

            {/* Tanggal Keberangkatan & Kepulangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TANGGAL KEBERANGKATAN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={formDepartDate}
                    onChange={(e) => setFormDepartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TANGGAL KEPULANGAN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={formReturnDate}
                    onChange={(e) => setFormReturnDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Kota Keberangkatan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                KOTA KEBERANGKATAN / EMBARKASI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formDepartCity}
                onChange={(e) => setFormDepartCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Hotel Mekah & Madinah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>HOTEL MEKAH</span>
                </label>
                <div className="relative">
                  <select
                    value={formHotelMekah}
                    onChange={(e) => setFormHotelMekah(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>-- Pilih Hotel Mekah --</option>
                    {makkahHotels.map((hName, idx) => (
                      <option key={idx} value={hName}>
                        {hName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>HOTEL MADINAH</span>
                </label>
                <div className="relative">
                  <select
                    value={formHotelMadinah}
                    onChange={(e) => setFormHotelMadinah(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>-- Pilih Hotel Madinah --</option>
                    {madinahHotels.map((hName, idx) => (
                      <option key={idx} value={hName}>
                        {hName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Maskapai */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Plane className="h-3 w-3 text-slate-400" />
                <span>MASKAPAI PENERBANGAN</span>
              </label>
              <div className="relative">
                <select
                  value={formAirline}
                  onChange={(e) => setFormAirline(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                >
                  <option>-- Pilih Maskapai Penerbangan --</option>
                  {airlineOptions.map((aName, idx) => (
                    <option key={idx} value={aName}>
                      {aName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Section 3: Fasilitas & Catatan Layanan */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Fasilitas &amp; Catatan Layanan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  FASILITAS TERMASUK (INCLUDED)
                </label>
                <textarea
                  rows={6}
                  value={formIncluded}
                  onChange={(e) => setFormIncluded(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Masukkan 1 poin fasilitas per baris.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  FASILITAS TIDAK TERMASUK (EXCLUDED)
                </label>
                <textarea
                  rows={6}
                  value={formExcluded}
                  onChange={(e) => setFormExcluded(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Masukkan 1 poin fasilitas per baris.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <span>Buat Paket Sekarang</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 text-xs font-semibold transition shadow-sm"
            >
              <span>Batal</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Default: Table view
  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Paket Umroh &amp; Haji
            </h1>
            <p className="text-xs text-slate-400">
              Katalog dan konfigurasi jadwal keberangkatan, akomodasi, dan kuota jamaah.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Paket</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama paket, kota keberangkatan..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Jenis Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Jenis</option>
              <option>Umroh</option>
              <option>Haji</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Status</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Terapkan button */}
          <button className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 px-4 py-1.5 text-xs font-semibold transition">
            Terapkan
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">NAMA &amp; DURASI PAKET</th>
                <th className="pb-3.5 font-bold">JENIS</th>
                <th className="pb-3.5 font-bold">HARGA</th>
                <th className="pb-3.5 font-bold">SISA KUOTA</th>
                <th className="pb-3.5 font-bold">KEBERANGKATAN</th>
                <th className="pb-3.5 font-bold">AKOMODASI</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPackages.map((item) => {
                const percent = Math.round((item.bookedSeats / item.totalSeats) * 100);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Nama & Durasi */}
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.duration} • {item.branch}
                      </p>
                    </td>

                    {/* Jenis */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        {item.type}
                      </span>
                    </td>

                    {/* Harga */}
                    <td className="py-3.5 pr-4 font-bold text-slate-900 whitespace-nowrap">
                      {item.price}
                    </td>

                    {/* Sisa Kuota */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>
                          {item.bookedSeats} / {item.totalSeats} Kursi
                        </span>
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Keberangkatan */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.departureDate}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dari: {item.departureCity}
                      </p>
                    </td>

                    {/* Akomodasi */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{item.hotel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Plane className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span>{item.airline}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        {item.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-slate-400">
                        <button
                          title="Lihat Detail"
                          className="p-1 hover:text-slate-700 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Ubah Paket"
                          className="p-1 hover:text-slate-700 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                          className="p-1 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
