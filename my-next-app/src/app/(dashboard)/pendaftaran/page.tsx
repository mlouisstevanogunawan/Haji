"use client";

import * as React from "react";
import Link from "next/link";
import {
  Filter,
  Plus,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  BookingWithDetails,
} from "@/services/bookingService";
import { getPackages, isBookable, seatsLeftFor, PackageRow } from "@/services/packageService";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";
import { getGuides, GuideRow } from "@/services/guideService";
import { getInvoices } from "@/services/invoiceService";
import { useRole } from "@/context/RoleContext";
import { createClient } from "@/lib/supabase/client";

interface RegistrationItem {
  id: string;
  code: string;
  jamaahName: string;
  pilgrimId: string | null;
  packageName: string;
  status: "Dikonfirmasi" | "Pending" | "Batal";
  paymentStatus: "Lunas" | "Sebagian" | "Belum Bayar";
  registrationDate: string;
  phone?: string;
  price?: string;
}

interface RingkasanBayar {
  total: number;
  paid: number;
}

const STATUS_LABEL: Record<string, RegistrationItem["status"]> = {
  pending: "Pending",
  confirmed: "Dikonfirmasi",
  completed: "Dikonfirmasi",
  cancelled: "Batal",
};

function mapBookingToRegistrationItem(
  b: BookingWithDetails,
  bayar?: RingkasanBayar
): RegistrationItem {
  let regDate = b.created_at;
  try {
    regDate = new Date(b.created_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {}

  // Status bayar dihitung dari tagihan (invoices) milik booking ini, bukan dari
  // kolom status booking.
  const total = Number(bayar?.total || 0);
  const paid = Number(bayar?.paid || 0);
  let payStatus: "Lunas" | "Sebagian" | "Belum Bayar" = "Belum Bayar";
  if (total > 0 && paid >= total) {
    payStatus = "Lunas";
  } else if (paid > 0) {
    payStatus = "Sebagian";
  }

  return {
    id: b.id,
    code: b.kode_booking,
    jamaahName: b.profiles?.full_name || "-",
    pilgrimId: b.pilgrim_id ?? null,
    packageName: b.packages?.name || "-",
    status: STATUS_LABEL[b.status] || "Pending",
    paymentStatus: payStatus,
    registrationDate: regDate,
    phone: b.profiles?.phone || "-",
    price: `Rp ${Number(b.total_price || b.packages?.price || 0).toLocaleString("id-ID")}`,
  };
}

export default function PendaftaranPage() {
  const { role, user } = useRole();
  const isJamaah = role === "jamaah_umroh";
  const userId = user.id;

  const [registrations, setRegistrations] = React.useState<RegistrationItem[]>([]);
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [pilgrims, setPilgrims] = React.useState<JamaahProfile[]>([]);
  const [, setGuides] = React.useState<GuideRow[]>([]);
  const [, setIsLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [packageFilter, setPackageFilter] = React.useState("Semua Paket");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");
  const [appliedPackage, setAppliedPackage] = React.useState("Semua Paket");

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [detailItem, setDetailItem] = React.useState<RegistrationItem | null>(null);
  const [editItem, setEditItem] = React.useState<RegistrationItem | null>(null);

  // Form states
  const [selectedPilgrimId, setSelectedPilgrimId] = React.useState("");
  const [selectedPkgId, setSelectedPkgId] = React.useState("");
  const [bookingDate, setBookingDate] = React.useState(new Date().toISOString().split("T")[0]);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [bks, pkgs, plgs, gds, invoices] = await Promise.all([
        getBookings(),
        getPackages(),
        getJamaahList(),
        getGuides().catch(() => []),
        getInvoices().catch(() => []),
      ]);

      // Ringkasan pembayaran per booking, diambil dari tabel invoices asli.
      const bayarPerBooking = new Map<string, RingkasanBayar>();
      invoices.forEach((inv) => {
        const bookingId = inv.bookings?.id;
        if (!bookingId) return;
        const prev = bayarPerBooking.get(bookingId) || { total: 0, paid: 0 };
        bayarPerBooking.set(bookingId, {
          total: prev.total + (Number(inv.amount) || 0),
          paid: prev.paid + (Number(inv.paid_amount) || 0),
        });
      });

      setRegistrations(
        (bks || []).map((b) => mapBookingToRegistrationItem(b, bayarPerBooking.get(b.id)))
      );
      setPackages(pkgs || []);
      setPilgrims(plgs || []);
      setGuides(gds || []);
    } catch (err: unknown) {
      console.error("Gagal memuat data pendaftaran:", err);
      alert(`Gagal memuat data pendaftaran: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Pendaftaran dan kuota berubah dari banyak jalur (form admin, portal agen,
  // pembayaran Midtrans). Langganan ini membuat daftar ikut tanpa refresh.
  React.useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        loadData();
      }, 400);
    };

    const channel = supabase
      .channel("pendaftaran-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, scheduleReload)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleApplyFilter = () => {
    setAppliedStatus(statusFilter);
    setAppliedPackage(packageFilter);
  };

  const filteredList = registrations.filter((item) => {
    const matchesStatus =
      appliedStatus === "Semua Status" ||
      item.status.toLowerCase() === appliedStatus.toLowerCase() ||
      item.paymentStatus.toLowerCase() === appliedStatus.toLowerCase();

    const matchesPackage =
      appliedPackage === "Semua Paket" ||
      item.packageName.toLowerCase().includes(appliedPackage.toLowerCase());

    return matchesStatus && matchesPackage;
  });

  // Jamaah: hanya menampilkan pendaftarannya sendiri (pilgrim_id = user.id login).
  const displayedList = isJamaah
    ? filteredList.filter((item) => item.pilgrimId === userId)
    : filteredList;

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPilgrimId || !selectedPkgId) {
      alert("Silakan pilih Jamaah dan Paket Keberangkatan!");
      return;
    }

    const pkg = packages.find((p) => p.id === selectedPkgId);
    if (!pkg) {
      alert("Paket yang dipilih tidak ditemukan di database.");
      return;
    }

    try {
      await createBooking({
        pilgrim_id: selectedPilgrimId,
        package_id: selectedPkgId,
        booking_date: bookingDate || new Date().toISOString().split("T")[0],
        departure_date: pkg.departure_date ?? null,
        total_price: Number(pkg.price) || 0,
        status: "pending",
      });

      setIsModalOpen(false);
      setSelectedPilgrimId("");
      setSelectedPkgId("");
      await loadData();
      alert("Pendaftaran jamaah berhasil disimpan ke database.");
    } catch (err: unknown) {
      console.error("Gagal membuat booking:", err);
      alert(`Gagal menyimpan booking: ${(err as Error).message}`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const payStatusMap: Record<
      RegistrationItem["paymentStatus"],
      "completed" | "confirmed" | "pending"
    > = {
      Lunas: "completed",
      Sebagian: "confirmed",
      "Belum Bayar": "pending",
    };

    try {
      await updateBooking(editItem.id, { status: payStatusMap[editItem.paymentStatus] });
      setEditItem(null);
      await loadData();
      alert("Perubahan pendaftaran berhasil disimpan.");
    } catch (err: unknown) {
      console.error("Gagal memperbarui pendaftaran:", err);
      alert(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus pendaftaran ini?")) {
      try {
        await deleteBooking(id);
        await loadData();
        alert("Pendaftaran berhasil dihapus.");
      } catch (err: unknown) {
        console.error("Gagal menghapus pendaftaran:", err);
        alert(`Gagal menghapus pendaftaran: ${(err as Error).message}`);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Pendaftaran</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Pendaftaran</h1>
          <p className="text-sm text-gray-500">Booking jamaah ke paket Umroh &amp; Haji</p>
        </div>

        {/* Primary Button */}
        {!isJamaah && (
          <div>
            <Link
              href="/pendaftaran/daftar"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Jamaah</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Dropdown Status */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm min-w-[150px]"
          >
            <option>Semua Status</option>
            <option>Dikonfirmasi</option>
            <option>Pending</option>
            <option>Lunas</option>
            <option>Sebagian</option>
            <option>Belum Bayar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown Paket */}
        <div className="relative">
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm min-w-[160px]"
          >
            <option>Semua Paket</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.name}>
                {pkg.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Tombol Filter */}
        <button
          onClick={handleApplyFilter}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filter</span>
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BAYAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TGL DAFTAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Kode */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.code}
                  </td>

                  {/* Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.jamaahName}
                  </td>

                  {/* Paket */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.packageName}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {item.status}
                    </span>
                  </td>

                  {/* Bayar */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.paymentStatus === "Lunas" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Lunas
                      </span>
                    )}
                    {item.paymentStatus === "Sebagian" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Sebagian
                      </span>
                    )}
                    {item.paymentStatus === "Belum Bayar" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Belum Bayar
                      </span>
                    )}
                  </td>

                  {/* Tgl Daftar */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.registrationDate}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isJamaah ? (
                      <Link
                        href={`/pendaftaran/${item.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                      >
                        Detail
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/pendaftaran/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </Link>
                        <Link
                          href={`/pendaftaran/edit/${item.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Daftarkan Jamaah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Daftarkan Jamaah Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Pilih Jamaah <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPilgrimId}
                  onChange={(e) => setSelectedPilgrimId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                >
                  <option value="">-- Pilih Jamaah Terdaftar --</option>
                  {pilgrims.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || "-"})
                    </option>
                  ))}
                  {pilgrims.length === 0 && (
                    <option value="" disabled>
                      Belum ada jamaah terdaftar di database
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Pilih Paket Keberangkatan <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                >
                  <option value="">-- Pilih Paket Keberangkatan --</option>
                  {packages.filter(isBookable).map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - Rp {Number(pkg.price).toLocaleString("id-ID")} (sisa{" "}
                      {seatsLeftFor(pkg) ?? "∞"} kursi)
                    </option>
                  ))}
                  {packages.filter(isBookable).length === 0 && (
                    <option value="" disabled>
                      Belum ada paket dengan sisa kuota
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Tanggal Booking</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Detail Pendaftaran</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Kode Booking</span>
                <span className="font-semibold text-gray-900">{detailItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Nama Jamaah</span>
                <span className="font-medium text-gray-900">{detailItem.jamaahName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Paket</span>
                <span className="font-medium text-gray-900">{detailItem.packageName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status Booking</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {detailItem.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status Pembayaran</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailItem.paymentStatus === "Lunas"
                      ? "bg-green-100 text-green-700"
                      : detailItem.paymentStatus === "Sebagian"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {detailItem.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Tanggal Pendaftaran</span>
                <span className="text-gray-700">{detailItem.registrationDate}</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Pendaftaran</h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Kode Booking</label>
                <input
                  type="text"
                  disabled
                  value={editItem.code}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nama Jamaah</label>
                <input
                  type="text"
                  value={editItem.jamaahName}
                  onChange={(e) =>
                    setEditItem({ ...editItem, jamaahName: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Paket</label>
                <input
                  type="text"
                  value={editItem.packageName}
                  onChange={(e) =>
                    setEditItem({ ...editItem, packageName: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Status Pembayaran</label>
                <select
                  value={editItem.paymentStatus}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      paymentStatus: e.target.value as "Lunas" | "Sebagian" | "Belum Bayar",
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
