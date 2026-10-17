"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ChevronDown, X } from "lucide-react";
import { getBookings, updateBooking, BookingWithDetails } from "@/services/bookingService";
import { getInvoices, updateInvoice, InvoiceWithDetails } from "@/services/invoiceService";

interface AgentRegistrationItem {
  id: string;
  code: string;
  jamaah: string;
  paket: string;
  status: "Dikonfirmasi" | "Pending" | "Batal";
  bayar: "Lunas" | "Sebagian" | "Belum Bayar";
  tglDaftar: string;
  invoiceId: string | null;
}

export default function AgenPendaftaranPage() {
  const [registrations, setRegistrations] = React.useState<AgentRegistrationItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [packageFilter, setPackageFilter] = React.useState("Semua Paket");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");
  const [appliedPackage, setAppliedPackage] = React.useState("Semua Paket");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals for Detail & Edit
  const [detailItem, setDetailItem] = React.useState<AgentRegistrationItem | null>(null);
  const [editItem, setEditItem] = React.useState<AgentRegistrationItem | null>(null);


  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load from Supabase
  const loadData = React.useCallback(async () => {
    try {
      const [data, invoices] = await Promise.all([getBookings(), getInvoices()]);

      // Status pembayaran diambil dari invoice terkait booking, bukan dari
      // kolom fiktif di tabel bookings.
      const invoiceByBooking = new Map<string, InvoiceWithDetails>();
      for (const inv of invoices || []) {
        if (inv.booking_id && !invoiceByBooking.has(inv.booking_id)) {
          invoiceByBooking.set(inv.booking_id, inv);
        }
      }

      const mapped: AgentRegistrationItem[] = (data || []).map((b: BookingWithDetails) => {
        const rawStatus = (b.status || "").toLowerCase();
        let statusLabel: AgentRegistrationItem["status"] = "Pending";
        if (rawStatus === "confirmed" || rawStatus === "completed") statusLabel = "Dikonfirmasi";
        else if (rawStatus === "cancelled") statusLabel = "Batal";

        const inv = invoiceByBooking.get(b.id);
        const rawPayment = (inv?.status || "").toLowerCase();
        let paymentLabel: AgentRegistrationItem["bayar"] = "Belum Bayar";
        if (rawPayment === "paid") paymentLabel = "Lunas";
        else if (rawPayment === "partial") paymentLabel = "Sebagian";

        const tanggal = b.booking_date || b.created_at;

        return {
          id: b.id,
          // invoice_number adalah kolom nyata di bookings; tidak pernah dibuat
          // dari indeks baris. Bila belum ada, tampilkan strip kosong.
          code: b.invoice_number || "—",
          jamaah: b.profiles?.full_name || "—",
          paket: b.packages?.name || "—",
          status: statusLabel,
          bayar: paymentLabel,
          tglDaftar: tanggal
            ? new Date(tanggal).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          invoiceId: inv?.id ?? null,
        };
      });
      setRegistrations(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat data pendaftaran:", err);
      setRegistrations([]);
      showToast(`Gagal memuat data pendaftaran: ${(err as Error).message}`);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedStatus(statusFilter);
    setAppliedPackage(packageFilter);
  };

  // Pilihan filter paket diambil dari paket yang benar-benar dipakai booking.
  const packageOptions = React.useMemo(() => {
    const names = new Set<string>();
    for (const item of registrations) {
      if (item.paket && item.paket !== "—") names.add(item.paket);
    }
    return Array.from(names).sort();
  }, [registrations]);

  const filteredRegistrations = registrations.filter((item) => {
    const matchStatus =
      appliedStatus === "Semua Status" ||
      item.status.toLowerCase() === appliedStatus.toLowerCase();

    const matchPackage =
      appliedPackage === "Semua Paket" ||
      item.paket.toLowerCase() === appliedPackage.toLowerCase();

    return matchStatus && matchPackage;
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const statusMap: Record<AgentRegistrationItem["status"], "confirmed" | "pending" | "cancelled"> = {
      Dikonfirmasi: "confirmed",
      Pending: "pending",
      Batal: "cancelled",
    };

    const invoiceStatusMap: Record<AgentRegistrationItem["bayar"], "paid" | "partial" | "unpaid"> = {
      Lunas: "paid",
      Sebagian: "partial",
      "Belum Bayar": "unpaid",
    };

    try {
      await updateBooking(editItem.id, { status: statusMap[editItem.status] });

      if (editItem.invoiceId) {
        await updateInvoice(editItem.invoiceId, { status: invoiceStatusMap[editItem.bayar] });
      }

      setEditItem(null);
      await loadData();
      showToast(
        editItem.invoiceId
          ? "Perubahan pendaftaran berhasil disimpan ke Supabase!"
          : "Status pendaftaran tersimpan. Status bayar tidak disimpan karena booking ini belum punya invoice."
      );
    } catch (err: unknown) {
      console.error("Gagal memperbarui pendaftaran:", err);
      showToast(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/agen/dashboard" className="hover:text-gray-600 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <span className="text-gray-500 font-medium">Pendaftaran</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pendaftaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Booking jamaah ke paket Umroh &amp; Haji</p>
        </div>

        <div>
          <Link
            href="/agen/pendaftaran/daftar"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Daftarkan Jamaah</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Dikonfirmasi">Dikonfirmasi</option>
            <option value="Pending">Pending</option>
            <option value="Batal">Batal</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative min-w-[200px]">
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            <option value="Semua Paket">Semua Paket</option>
            {packageOptions.map((nama) => (
              <option key={nama} value={nama}>
                {nama}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-2xs cursor-pointer"
        >
          Filter
        </button>
      </form>

      {/* Tabel Pendaftaran */}
      <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80">
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  KODE
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  BAYAR
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  TGL DAFTAR
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    Tidak ada pendaftaran jamaah ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors border-b border-gray-100"
                  >
                    {/* Kode */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700 font-medium">
                      {item.code}
                    </td>

                    {/* Jamaah */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-900 font-medium">
                      {item.jamaah}
                    </td>

                    {/* Paket */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700 font-normal">
                      {item.paket}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {item.status === "Dikonfirmasi" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                          Dikonfirmasi
                        </span>
                      )}
                      {item.status === "Pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                          Pending
                        </span>
                      )}
                      {item.status === "Batal" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700">
                          Batal
                        </span>
                      )}
                    </td>

                    {/* Bayar Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {item.bayar === "Lunas" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                          Lunas
                        </span>
                      )}
                      {item.bayar === "Sebagian" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                          Sebagian
                        </span>
                      )}
                      {item.bayar === "Belum Bayar" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700">
                          Belum Bayar
                        </span>
                      )}
                    </td>

                    {/* Tgl Daftar */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-normal">
                      {item.tglDaftar}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                        >
                          Edit
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

      {/* Modal Detail */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Detail Pendaftaran</h3>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Nomor Registrasi</span>
                <span className="font-semibold text-gray-800">{detailItem.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Nama Jamaah</span>
                <span className="font-semibold text-gray-800">{detailItem.jamaah}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Paket Terpilih</span>
                <span className="font-semibold text-gray-800">{detailItem.paket}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Status Registrasi</span>
                <span className="font-semibold text-blue-700">{detailItem.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Status Pembayaran</span>
                <span className="font-semibold text-emerald-700">{detailItem.bayar}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Tanggal Booking</span>
                <span className="font-semibold text-gray-800">{detailItem.tglDaftar}</span>
              </div>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Pendaftaran */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 animate-in fade-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Edit Pendaftaran</h3>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Status Registrasi</label>
                <select
                  value={editItem.status}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      status: e.target.value as AgentRegistrationItem["status"],
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Dikonfirmasi">Dikonfirmasi</option>
                  <option value="Pending">Pending</option>
                  <option value="Batal">Batal</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Status Pembayaran</label>
                <select
                  value={editItem.bayar}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      bayar: e.target.value as AgentRegistrationItem["bayar"],
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
