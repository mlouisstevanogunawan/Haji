"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Edit2, CreditCard, Building2, Calendar, Check } from "lucide-react";
import {
  getBookingById,
  updateBooking,
  BookingWithDetails,
  BookingStatus,
} from "@/services/bookingService";

interface BillItem {
  code: string;
  type: string;
  amount: string;
  paid: string;
  status: "Belum Bayar" | "Lunas" | "Sebagian";
  dueDate: string;
}

interface RegistrationDetail {
  id: string;
  code: string;
  jamaahName: string;
  passportNumber: string;
  phone: string;
  packageName: string;
  packageType: string;
  departureDate: string;
  status: string;
  registrationDate: string;
  packagePrice: string;
  agent: string;
  guide: string;
  branch: string;
  totalBill: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: string;
  bills: BillItem[];
}

const STATUS_TO_LABEL: Record<string, string> = {
  confirmed: "Dikonfirmasi",
  pending: "Pending",
  cancelled: "Batal",
  completed: "Selesai",
};

const LABEL_TO_STATUS: Record<string, BookingStatus> = {
  Dikonfirmasi: "confirmed",
  Pending: "pending",
  Batal: "cancelled",
  Selesai: "completed",
};

function formatRp(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// Hanya kolom yang benar-benar dikembalikan getBookingById (bookings + profiles +
// packages) yang diisi. Field tanpa sumber (agen, pembimbing, cabang, paspor,
// rincian pembayaran/tagihan) dibiarkan kosong, tidak dikarang-karang.
function mapBookingToDetail(booking: BookingWithDetails): RegistrationDetail {
  const label = STATUS_TO_LABEL[booking.status] || "";
  return {
    id: booking.id,
    code: booking.invoice_number || `REG-${booking.id.slice(0, 5).toUpperCase()}`,
    jamaahName: booking.profiles?.full_name || "",
    passportNumber: "",
    phone: booking.profiles?.phone || "",
    packageName: booking.packages?.name || "",
    packageType: booking.packages?.type
      ? booking.packages.type.toLowerCase().includes("haji")
        ? "Haji"
        : "Umroh"
      : "",
    departureDate: formatDate(booking.departure_date),
    status: label,
    registrationDate: formatDate(booking.booking_date || booking.created_at),
    packagePrice: formatRp(booking.total_price),
    agent: "",
    guide: "",
    branch: "",
    totalBill: formatRp(booking.total_price),
    paidAmount: "",
    remainingAmount: "",
    paymentStatus: "",
    bills: [],
  };
}

export default function DetailPendaftaranPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [data, setData] = React.useState<RegistrationDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [statusUpdatedSuccess, setStatusUpdatedSuccess] = React.useState(false);

  const loadRegistration = React.useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setNotFound(false);
    setLoadError("");
    try {
      const booking = await getBookingById(id);
      if (!booking) {
        setNotFound(true);
        return;
      }
      const detail = mapBookingToDetail(booking);
      setData(detail);
      setSelectedStatus(detail.status);
    } catch (err: unknown) {
      console.error("Gagal memuat detail pendaftaran:", err);
      setLoadError((err as Error).message || "Gagal memuat detail pendaftaran.");
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadRegistration();
  }, [loadRegistration]);

  const handleUpdateStatus = async () => {
    if (!data) return;
    setIsUpdatingStatus(true);
    try {
      const dbStatus = LABEL_TO_STATUS[selectedStatus] || "confirmed";
      await updateBooking(data.id, { status: dbStatus });
      // Ambil ulang dari DB, jangan cuma ubah state lokal.
      await loadRegistration();
      setStatusUpdatedSuccess(true);
      setTimeout(() => setStatusUpdatedSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Gagal mengubah status pendaftaran:", err);
      alert(`Gagal mengubah status: ${(err as Error).message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-sm text-gray-500">
          Memuat data pendaftaran...
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <p className="text-sm font-medium text-gray-900">Data tidak ditemukan</p>
          {loadError && <p className="text-xs text-red-600">{loadError}</p>}
          <Link
            href="/pendaftaran"
            className="inline-flex rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm"
          >
            Kembali ke Pendaftaran
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb & Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <Link href="/pendaftaran" className="hover:text-gray-900 transition">
              Pendaftaran
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{data.code}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{data.jamaahName}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{data.code}</p>
        </div>

        <div>
          <Link
            href={`/pendaftaran/edit/${id || data.code}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-2 text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* 3 Stat Cards on Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Tagihan */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Tagihan</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{data.totalBill || "-"}</p>
          </div>
        </div>

        {/* Sudah Dibayar */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Sudah Dibayar</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{data.paidAmount || "-"}</p>
          </div>
        </div>

        {/* Sisa */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Sisa</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-gray-900">{data.remainingAmount || "-"}</span>
              {data.paymentStatus && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                  {data.paymentStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Cards Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card Kiri: Informasi Pendaftaran */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Informasi Pendaftaran
          </h2>

          <div className="space-y-3 text-xs">
            {/* Status */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                {data.status || "-"}
              </span>
            </div>

            {/* Tanggal Daftar */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Tanggal Daftar</span>
              <span className="font-medium text-gray-800">{data.registrationDate || "-"}</span>
            </div>

            {/* Harga Paket */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Harga Paket</span>
              <span className="font-medium text-gray-800">{data.packagePrice || "-"}</span>
            </div>

            {/* Agen */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Agen</span>
              <span className="font-medium text-gray-800">{data.agent || "-"}</span>
            </div>

            {/* Pembimbing */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Pembimbing</span>
              <span className="font-medium text-gray-800">{data.guide || "-"}</span>
            </div>

            {/* Cabang */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Cabang</span>
              <span className="font-medium text-gray-800">{data.branch || "-"}</span>
            </div>
          </div>

          {/* Form Ubah Status */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Ubah Status
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm"
              >
                <option value="Dikonfirmasi">Dikonfirmasi</option>
                <option value="Pending">Pending</option>
                <option value="Batal">Batal</option>
                <option value="Selesai">Selesai</option>
              </select>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                {statusUpdatedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <span>{isUpdatingStatus ? "Menyimpan..." : "Simpan"}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card Kanan: Jamaah & Paket */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Jamaah &amp; Paket
          </h2>

          <div className="space-y-3 text-xs">
            {/* Jamaah */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Jamaah</span>
              <span className="font-medium text-gray-800">{data.jamaahName || "-"}</span>
            </div>

            {/* No. Paspor */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">No. Paspor</span>
              <span className="font-mono font-medium text-gray-800">{data.passportNumber || "-"}</span>
            </div>

            {/* Telepon */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Telepon</span>
              <span className="font-medium text-gray-800">{data.phone || "-"}</span>
            </div>

            {/* Paket */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Paket</span>
              <span className="font-medium text-gray-800">{data.packageName || "-"}</span>
            </div>

            {/* Jenis Paket */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Jenis Paket</span>
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                {data.packageType || "-"}
              </span>
            </div>

            {/* Tanggal Berangkat */}
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Tanggal Berangkat</span>
              <span className="font-medium text-gray-800">{data.departureDate || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Bawah: Tagihan & Pembayaran */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Tagihan &amp; Pembayaran</h2>
          <Link
            href="/tagihan-kasir"
            className="text-xs text-teal-600 hover:text-teal-700 font-medium transition cursor-pointer"
          >
            Kelola Tagihan
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JENIS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  TAGIHAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DIBAYAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JATUH TEMPO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.bills.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-xs text-gray-500"
                  >
                    Belum ada data tagihan dari kasir.
                  </td>
                </tr>
              ) : (
                data.bills.map((bill) => (
                  <tr key={bill.code} className="hover:bg-gray-50 transition border-b border-gray-100 text-xs">
                    {/* Kode */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-800 font-normal">
                      {bill.code}
                    </td>

                    {/* Jenis */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bill.type === "Uang Muka (DP)" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {bill.type}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {bill.type}
                        </span>
                      )}
                    </td>

                    {/* Tagihan */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                      {bill.amount}
                    </td>

                    {/* Dibayar */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {bill.paid}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {bill.status}
                      </span>
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {bill.dueDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
