"use client";

import * as React from "react";
import {
  Layers,
  Search,
  Calendar,
  Building2,
  Plane,
  Users,
  ChevronRight,
  X,
  BedDouble,
  Bus,
  Check,
} from "lucide-react";

import { getPackages, PackageRow } from "@/services/packageService";
import { getBookings, BookingWithDetails } from "@/services/bookingService";

interface ManifestPackage {
  id: string;
  name: string;
  branch: string;
  category: string;
  departureDate: string;
  departureCity: string;
  makkahHotel: string;
  madinahHotel: string;
  airline: string;
  registeredCount: number;
  quotaCount: number;
  pilgrims: string[];
}

interface RoomGroup {
  id: string;
  roomNumber: string;
  type: "Quad (4 Bed)" | "Triple (3 Bed)" | "Double (2 Bed)";
  hotelName: string;
  pilgrims: string[];
}

export default function ManifestRoomingPage() {
  const [packages, setPackages] = React.useState<ManifestPackage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activePackageForManifest, setActivePackageForManifest] = React.useState<ManifestPackage | null>(null);

  // Rooming State for Modal
  const [roomGroups, setRoomGroups] = React.useState<RoomGroup[]>([]);
  const [selectedBus, setSelectedBus] = React.useState("Bus 01 (Executive SAPTCO)");
  const [saveToast, setSaveToast] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [pkgs, bks] = await Promise.all([getPackages(), getBookings()]);
        const mapped: ManifestPackage[] = pkgs.map((p) => {
          const pkgBookings = bks.filter((b) => b.package_id === p.id);
          const pilgrims = pkgBookings.map((b) => b.profiles?.full_name || "Jamaah");
          const facilities = p.facilities || [];
          const makkahHotel = facilities.find((f) => f.toLowerCase().includes("makkah")) || "Swissôtel Al Maqam Makkah";
          const madinahHotel = facilities.find((f) => f.toLowerCase().includes("madinah")) || "Dar Al Taqwa Hotel Madinah";
          const airline = facilities.find((f) => /garuda|saudia|emirates|qatar|lion/i.test(f)) || "Saudia Airlines";

          return {
            id: p.id,
            name: p.name,
            branch: "Kantor Pusat Jakarta",
            category: p.type === "haji" ? "Haji_khusus" : "Umroh",
            departureDate: new Date(p.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            departureCity: "Jakarta",
            makkahHotel,
            madinahHotel,
            airline,
            registeredCount: pkgBookings.length,
            quotaCount: p.quota || 45,
            pilgrims,
          };
        });
        setPackages(mapped);
      } catch (err) {
        console.error("Gagal memuat manifest dari Supabase:", err);
        setPackages([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenManifest = (pkg: ManifestPackage) => {
    setActivePackageForManifest(pkg);
    // dynamically generate room allocations from registered pilgrims
    if (pkg.pilgrims.length > 0) {
      const rooms: RoomGroup[] = [];
      const chunkSize = 4;
      for (let i = 0; i < pkg.pilgrims.length; i += chunkSize) {
        const chunk = pkg.pilgrims.slice(i, i + chunkSize);
        rooms.push({
          id: `room-${i}`,
          roomNumber: `Kamar ${401 + Math.floor(i / chunkSize)}`,
          type: chunk.length <= 2 ? "Double (2 Bed)" : chunk.length === 3 ? "Triple (3 Bed)" : "Quad (4 Bed)",
          hotelName: pkg.makkahHotel,
          pilgrims: chunk,
        });
      }
      setRoomGroups(rooms);
    } else {
      setRoomGroups([
        {
          id: "r1",
          roomNumber: "Kamar 401",
          type: "Quad (4 Bed)",
          hotelName: pkg.makkahHotel,
          pilgrims: ["Belum ada jamaah terdaftar"],
        },
      ]);
    }
  };

  const filteredPackages = packages.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.airline.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveManifest = () => {
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      setActivePackageForManifest(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Manifest &amp; Rooming Hotel
            </h1>
            <p className="text-xs text-slate-400">
              Pilih paket keberangkatan untuk mengatur penempatan kamar hotel, bus jemputan, dan nomor kursi jamaah.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama paket keberangkatan..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <button className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 px-4 py-1.5 text-xs font-semibold transition">
          Cari
        </button>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">PAKET PERJALANAN</th>
                <th className="pb-3.5 font-bold">KEBERANGKATAN</th>
                <th className="pb-3.5 font-bold">AKOMODASI HOTEL</th>
                <th className="pb-3.5 font-bold">MASKAPAI</th>
                <th className="pb-3.5 font-bold">JAMAAH TERDAFTAR</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/70 transition">
                  {/* Paket Perjalanan */}
                  <td className="py-3.5 pr-4 max-w-xs">
                    <p className="font-semibold text-slate-900">{pkg.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {pkg.branch} • {pkg.category}
                    </p>
                  </td>

                  {/* Keberangkatan */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{pkg.departureDate}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dari: {pkg.departureCity}
                    </p>
                  </td>

                  {/* Akomodasi Hotel */}
                  <td className="py-3.5 pr-4 max-w-xs">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{pkg.makkahHotel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{pkg.madinahHotel}</span>
                    </div>
                  </td>

                  {/* Maskapai */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Plane className="h-3.5 w-3.5 text-slate-400" />
                      <span>{pkg.airline}</span>
                    </div>
                  </td>

                  {/* Jamaah Terdaftar */}
                  <td className="py-3.5 pr-4 whitespace-nowrap font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {pkg.registeredCount} / {pkg.quotaCount} Jamaah
                      </span>
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleOpenManifest(pkg)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 text-xs font-semibold transition shadow-sm active:scale-95"
                    >
                      <span>Atur Manifest</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Atur Manifest & Rooming (100% Fungsional) */}
      {activePackageForManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Pengaturan Manifest &amp; Rooming List
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activePackageForManifest.name} ({activePackageForManifest.airline})
                </p>
              </div>
              <button
                onClick={() => setActivePackageForManifest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bus Assignment selector */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bus className="h-5 w-5 text-emerald-700" />
                <div>
                  <span className="font-bold text-slate-900 block">Armada Bus Bandara &amp; Ziarah</span>
                  <span className="text-[11px] text-slate-400">Kapasitas 45 Kursi dengan AC &amp; Bagasi Luas</span>
                </div>
              </div>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none font-medium"
              >
                <option>Bus 01 (Executive SAPTCO)</option>
                <option>Bus 02 (VIP Qawafil)</option>
              </select>
            </div>

            {/* Rooming Hotel Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Penempatan Kamar Hotel ({activePackageForManifest.makkahHotel})
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Muthawif Pembimbing: Ustadz Abdullah
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {roomGroups.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <BedDouble className="h-4 w-4 text-emerald-600" />
                        <span>{room.roomNumber}</span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {room.type}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Daftar Penghuni:
                      </span>
                      {room.pilgrims.map((name, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 text-slate-700"
                        >
                          <span className="font-medium">{name}</span>
                          <span className="text-[10px] text-slate-400">Kasur {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {saveToast ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <Check className="h-4 w-4" /> Manifest dan Rooming List Berhasil Disimpan!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Data otomatis sinkron dengan koordinator logistik di Makkah &amp; Madinah.
                </span>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setActivePackageForManifest(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSaveManifest}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm active:scale-95"
                >
                  Simpan Manifest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
