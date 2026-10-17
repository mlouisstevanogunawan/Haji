"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  BedDouble,
  Bus,
  Users,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { getPackages, PackageRow } from "@/services/packageService";
import { getBookings, BookingWithDetails } from "@/services/bookingService";

interface ManifestItem {
  id: string;
  paket: string;
  jenis: "Umroh" | "Haji" | "Haji Plus";
  jumlahJamaah: number;
  berangkat: string;
  makkahHotel?: string;
  madinahHotel?: string;
  rooms?: {
    roomNo: string;
    type: "Quad (4 Bed)" | "Triple (3 Bed)" | "Double (2 Bed)";
    jamaahList: string[];
  }[];
  bus?: string;
}

export default function ManifestRoomingPage() {
  const [manifestList, setManifestList] = React.useState<ManifestItem[]>([]);
  const [, setIsLoading] = React.useState(true);
  const [selectedManifest, setSelectedManifest] = React.useState<ManifestItem | null>(null);

  // Tab state in modal: "rooms" or "bus"
  const [modalTab, setModalTab] = React.useState<"rooms" | "bus">("rooms");

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [pkgs, bks] = await Promise.all([getPackages(), getBookings()]);

      const mapped: ManifestItem[] = (pkgs || []).map((p) => {
        const pkgBookings: BookingWithDetails[] = (bks || []).filter(
          (b) => b.package_id === p.id
        );
        // Nama jamaah berasal dari booking.profiles yang nyata di database.
        const jamaahNames = pkgBookings
          .map((b) => b.profiles?.full_name)
          .filter((nama): nama is string => Boolean(nama));

        let jenisBadge: "Umroh" | "Haji" | "Haji Plus" = "Umroh";
        if (p.type === "haji") {
          jenisBadge = p.name.toLowerCase().includes("plus") ? "Haji Plus" : "Haji";
        }

        let berangkat = "-";
        if (p.departure_date) {
          berangkat = p.departure_date;
          try {
            berangkat = new Date(p.departure_date).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          } catch {}
        }

        // Rooming sementara: jamaah dipecah 3 orang per kamar dari data booking asli.
        const rooms: NonNullable<ManifestItem["rooms"]> = [];
        for (let i = 0; i < jamaahNames.length; i += 3) {
          rooms.push({
            roomNo: `Kamar ${i / 3 + 1}`,
            type: "Triple (3 Bed)",
            jamaahList: jamaahNames.slice(i, i + 3),
          });
        }

        return {
          id: p.id,
          paket: p.name,
          jenis: jenisBadge,
          jumlahJamaah: pkgBookings.length,
          berangkat,
          rooms,
        };
      });
      setManifestList(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat manifest dari Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>Beranda</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Manifest</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Manifest &amp; Rooming</h1>
        <p className="text-sm text-gray-500">
          Pengaturan kamar, bus, dan kursi jamaah per paket
        </p>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JENIS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JUMLAH JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  BERANGKAT
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manifestList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Paket */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.paket}
                  </td>

                  {/* Jenis */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.jenis === "Umroh" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Umroh
                      </span>
                    )}
                    {item.jenis === "Haji" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Haji
                      </span>
                    )}
                    {item.jenis === "Haji Plus" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Haji Plus
                      </span>
                    )}
                  </td>

                  {/* Jumlah Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.jumlahJamaah}
                  </td>

                  {/* Berangkat */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.berangkat}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/manifest/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Kelola Manifest</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kelola Manifest */}
      {selectedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Kelola Manifest &amp; Rooming
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedManifest.paket} &bull; Keberangkatan {selectedManifest.berangkat}
                </p>
              </div>
              <button
                onClick={() => setSelectedManifest(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-3 gap-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => setModalTab("rooms")}
                className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                  modalTab === "rooms"
                    ? "border-teal-600 text-teal-700 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <BedDouble className="h-4 w-4" />
                <span>Rooming Hotel</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("bus")}
                className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                  modalTab === "bus"
                    ? "border-teal-600 text-teal-700 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Bus className="h-4 w-4" />
                <span>Plotting Bus &amp; Kursi</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-96 overflow-y-auto space-y-4">
              {modalTab === "rooms" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-gray-500 block">Hotel Makkah:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedManifest.makkahHotel || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Hotel Madinah:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedManifest.madinahHotel || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Alokasi Kamar Jamaah
                      </span>
                    </div>

                    {(selectedManifest.rooms || []).length === 0 && (
                      <p className="text-xs text-gray-500">
                        Belum ada jamaah terdaftar pada paket ini.
                      </p>
                    )}

                    {(selectedManifest.rooms || []).map((room, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 rounded-lg bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">
                            {room.roomNo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {room.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-gray-500">Penghuni: </span>
                          <span>{room.jamaahList.join(", ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-teal-100 bg-teal-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-teal-900">
                        Armada: {selectedManifest.bus || "-"}
                      </span>
                      <span className="text-xs font-semibold text-teal-700">
                        {selectedManifest.jumlahJamaah} Jamaah
                      </span>
                    </div>
                    <p className="text-xs text-teal-800">
                      Data armada bus &amp; kursi belum tersimpan di database.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-gray-500">
                      Pilih Armada Bus
                    </label>
                    <select
                      disabled
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-gray-50 text-gray-500 focus:outline-none"
                    >
                      <option value="">Belum ada data armada</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  alert("Export manifest belum tersedia: belum ada fungsi generator berkas Excel/PDF di service.")
                }
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Manifest (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedManifest(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
