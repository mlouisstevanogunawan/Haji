"use client";

import * as React from "react";
import {
  Search,
  Filter,
  UserPlus,
  ChevronDown,
  Calendar,
  Eye,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Info,
} from "lucide-react";

import {
  getBookings,
  createBooking,
  deleteBooking,
  BookingWithDetails,
} from "@/services/bookingService";
import { getPackages, PackageRow } from "@/services/packageService";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { getGuides, GuideRow } from "@/services/guideService";

interface RegistrationItem {
  id: string;
  code: string;
  jamaahName: string;
  jamaahPhone: string;
  packageName: string;
  packagePrice: string;
  status: "Pending" | "Dikonfirmasi" | "Batal";
  paymentStatus: "Belum Bayar" | "Sebagian" | "Lunas";
  registrationDate: string;
}

function mapBookingToRegistrationItem(b: BookingWithDetails): RegistrationItem {
  const statusMap: Record<string, "Pending" | "Dikonfirmasi" | "Batal"> = {
    pending: "Pending",
    confirmed: "Dikonfirmasi",
    completed: "Dikonfirmasi",
    cancelled: "Batal",
  };

  let regDate = b.created_at;
  try {
    regDate = new Date(b.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {}

  return {
    id: b.id,
    code: `REG-${b.id.slice(0, 6).toUpperCase()}`,
    jamaahName: b.profiles?.full_name || "Jamaah",
    jamaahPhone: b.profiles?.phone || "-",
    packageName: b.packages?.name || "Paket Umroh",
    packagePrice: `Rp ${Number(b.total_price || b.packages?.price || 0).toLocaleString("id-ID")}`,
    status: statusMap[b.status] || "Pending",
    paymentStatus: b.status === "confirmed" ? "Lunas" : "Belum Bayar",
    registrationDate: regDate,
  };
}

export default function PendaftaranPage() {
  const [registrations, setRegistrations] = React.useState<RegistrationItem[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [pilgrims, setPilgrims] = React.useState<JamaahProfile[]>([]);
  const [guides, setGuides] = React.useState<GuideRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [packageFilter, setPackageFilter] = React.useState("Semua Paket");
  const [isAdding, setIsAdding] = React.useState(false);

  // Booking Form States
  const [selectedPilgrimId, setSelectedPilgrimId] = React.useState("");
  const [selectedPkgId, setSelectedPkgId] = React.useState("");
  const [selectedMuthawif, setSelectedMuthawif] = React.useState("");
  const [bookingDate, setBookingDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [specialNotes, setSpecialNotes] = React.useState("");

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [bks, pkgs, plgs, gds] = await Promise.all([
        getBookings(),
        getPackages(),
        getJamaahList(),
        getGuides().catch(() => []),
      ]);
      setRegistrations(bks.map(mapBookingToRegistrationItem));
      setPackages(pkgs);
      setPilgrims(plgs);
      setGuides(gds);
    } catch (err: unknown) {
      console.error("Gagal memuat data pendaftaran:", err);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const chosenPackage = packages.find((p) => p.id === selectedPkgId);

  const filteredList = registrations.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jamaahName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jamaahPhone.includes(searchTerm);
    return matchesSearch;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilgrimId || !selectedPkgId) {
      alert("Silakan pilih Jamaah dan Paket Keberangkatan!");
      return;
    }

    try {
      const pkg = packages.find((p) => p.id === selectedPkgId);
      await createBooking({
        pilgrim_id: selectedPilgrimId,
        package_id: selectedPkgId,
        total_price: pkg?.price || 25000000,
        status: "pending",
      });
      await loadData();
      setIsAdding(false);
      setSelectedPilgrimId("");
      setSelectedPkgId("");
    } catch (err) {
      console.error("Gagal membuat booking:", err);
      alert("Gagal menyimpan pendaftaran ke database Supabase.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus pendaftaran ini?")) {
      try {
        await deleteBooking(id);
        await loadData();
      } catch (err) {
        console.error("Gagal menghapus pendaftaran:", err);
      }
    }
  };

  // If in Add Mode, show EXACT form from Screenshot 4
  if (isAdding) {
    return (
      <div className="space-y-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Beranda</span>
          <span>/</span>
          <button
            onClick={() => setIsAdding(false)}
            className="hover:text-slate-600 transition"
          >
            Pendaftaran
          </button>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Booking Baru</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(false)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Booking Jamaah Baru
            </h1>
            <p className="text-xs text-slate-400">
              Daftarkan jamaah ke paket Umroh atau Haji dengan validasi kuota otomatis.
            </p>
          </div>
        </div>

        {/* Two-Column Form Layout matching Screenshot 4 */}
        <form onSubmit={handleCreateBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Informasi Calon Jamaah &amp; Paket</span>
            </h3>

            {/* Pilih Jamaah */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                PILIH JAMAAH <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedPilgrimId}
                  onChange={(e) => setSelectedPilgrimId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  required
                >
                  <option value="">-- Pilih Jamaah Terdaftar --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || "-"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Pilih Paket */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                PILIH PAKET UMROH / HAJI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  required
                >
                  <option value="">-- Pilih Paket Keberangkatan --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - Rp {Number(pkg.price).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Pembimbing & Tanggal Booking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  PEMBIMBING / MUTHAWIF (OPSIONAL)
                </label>
                <div className="relative">
                  <select
                    value={selectedMuthawif}
                    onChange={(e) => setSelectedMuthawif(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option value="">-- Tanpa Pembimbing Khusus --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  TANGGAL BOOKING <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                CATATAN TAMBAHAN / PERMINTAAN KHUSUS
              </label>
              <textarea
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Contoh: Permintaan satu kamar dengan keluarga, riwayat kursi roda, dsb."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Right Column: Ringkasan Booking Card */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2.5 tracking-wider uppercase">
                RINGKASAN BOOKING
              </h3>

              {chosenPackage ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                  <p className="font-bold text-slate-900 text-sm">{chosenPackage.name}</p>
                  <p className="text-xl font-extrabold text-emerald-800">
                    Rp {Number(chosenPackage.price).toLocaleString("id-ID")}
                  </p>
                  <div className="space-y-1 text-slate-600 text-[11px] pt-2 border-t border-emerald-100">
                    <p>Kuota: <strong>{chosenPackage.quota} Kursi</strong></p>
                    <p>Durasi: <strong>{chosenPackage.duration_days} Hari</strong></p>
                    <p>Tipe: <strong>{chosenPackage.type.toUpperCase()}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                  Pilih paket untuk melihat detail harga, kuota, dan jadwal keberangkatan.
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Daftarkan Jamaah Sekarang
              </button>

              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
              >
                &larr; Batal
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Default: Table view
  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Pendaftaran
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Booking jamaah ke paket Umroh &amp; Haji, pantau status pendaftaran, dan sisa kuota kursi.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode booking atau nama jamaah..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Status</option>
              <option>Pending</option>
              <option>Dikonfirmasi</option>
              <option>Batal</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Package Dropdown */}
          <div className="relative">
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Paket</option>
              <option>Umroh Reguler Syawal 1447H</option>
              <option>Umroh Ramadhan Berkah</option>
              <option>Haji Khusus Furoda</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter button */}
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-medium transition">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          {/* Daftarkan Jamaah button */}
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Daftarkan Jamaah</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">KODE</th>
                <th className="pb-3.5 font-bold">JAMAAH</th>
                <th className="pb-3.5 font-bold">PAKET</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold">BAYAR</th>
                <th className="pb-3.5 font-bold">TGL DAFTAR</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Kode */}
                  <td className="py-3.5 pr-4">
                    <span className="font-semibold text-emerald-700 font-mono hover:underline cursor-pointer">
                      {item.code}
                    </span>
                  </td>

                  {/* Jamaah */}
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-slate-900">{item.jamaahName}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                      {item.jamaahPhone}
                    </p>
                  </td>

                  {/* Paket */}
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-slate-800">{item.packageName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.packagePrice}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        item.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-blue-50 text-blue-700 border-blue-200/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Bayar */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        item.paymentStatus === "Belum Bayar"
                          ? "bg-red-50 text-red-600 border-red-200/60"
                          : item.paymentStatus === "Sebagian"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                  </td>

                  {/* Tgl Daftar */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {item.registrationDate}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 text-[11px] font-medium transition">
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span>Detail</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 text-[11px] font-medium transition"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
