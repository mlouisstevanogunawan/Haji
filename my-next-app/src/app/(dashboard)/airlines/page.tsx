"use client";

import * as React from "react";
import {
  Plane,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Globe2,
} from "lucide-react";

import {
  getFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  FlightRow,
} from "@/services/flightService";

export interface AirlineItem {
  id: string;
  name: string;
  code: string;
  routeType: string;
  isDirect: boolean;
  status: "Aktif" | "Nonaktif";
}

export default function AirlinesPage() {
  const [airlines, setAirlines] = React.useState<AirlineItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("");
  const [formRouteType, setFormRouteType] = React.useState("");
  const [formIsDirect, setFormIsDirect] = React.useState<boolean>(true);
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  // Notification Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadFlights = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFlights();
      const mapped: AirlineItem[] = data.map((f) => ({
        id: f.id,
        name: f.airline_name,
        code: f.airline_code,
        routeType: f.route || "Direct CGK - JED",
        isDirect: (f.route || "").toLowerCase().includes("direct"),
        status: "Aktif",
      }));
      setAirlines(mapped);
    } catch (err: any) {
      console.error("Failed to load flights from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormRouteType("Direct CGK - JED");
    setFormIsDirect(true);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AirlineItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCode(item.code);
    setFormRouteType(item.routeType);
    setFormIsDirect(item.isDirect);
    setFormIsActive(item.status === "Aktif");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    try {
      if (editingId) {
        await updateFlight(editingId, {
          airline_name: formName.trim(),
          airline_code: formCode.trim().toUpperCase(),
          route: formRouteType.trim(),
        });
        showToast("Data maskapai berhasil diperbarui di database!");
      } else {
        await createFlight({
          airline_name: formName.trim(),
          airline_code: formCode.trim().toUpperCase(),
          route: formRouteType.trim() || "Direct CGK - JED",
        });
        showToast("Maskapai baru berhasil disimpan ke database Supabase!");
      }
      setIsModalOpen(false);
      await loadFlights();
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus maskapai "${name}" dari database?`)) {
      try {
        await deleteFlight(id);
        showToast("Maskapai berhasil dihapus dari database.");
        await loadFlights();
      } catch (err: any) {
        showToast(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  const filteredAirlines = airlines.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.routeType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-3 text-xs font-medium shadow-lg animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section (Screenshot 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Plane className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Maskapai Penerbangan
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manajemen maskapai penerbangan, kode IATA, dan rute transit keberangkatan umroh &amp; haji.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Maskapai</span>
        </button>
      </div>

      {/* Filter / Search Bar (Screenshot 5) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedSearch(searchQuery);
              }}
              placeholder="Cari maskapai atau kode..."
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

        <span className="text-xs text-slate-400 self-center">
          Total: {filteredAirlines.length} maskapai terdaftar
        </span>
      </div>

      {/* Table Data (Screenshot 5) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">NAMA MASKAPAI</th>
                <th className="pb-3.5 font-bold">KODE PENERBANGAN</th>
                <th className="pb-3.5 font-bold">TIPE RUTE / TRANSIT</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAirlines.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Nama Maskapai */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Plane className="h-4 w-4 text-sky-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </div>
                  </td>

                  {/* Kode Penerbangan */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 border border-slate-200">
                      {item.code}
                    </span>
                  </td>

                  {/* Tipe Rute / Transit */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    {item.isDirect ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        {item.routeType}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60">
                        {item.routeType}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{item.status}</span>
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-slate-400">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Ubah Maskapai"
                        className="p-1 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Hapus"
                        className="p-1 hover:text-red-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup Tambah/Edit Maskapai */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? "Edit Maskapai Penerbangan" : "Tambah Maskapai Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi maskapai penerbangan &amp; kode IATA
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NAMA MASKAPAI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Garuda Indonesia"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KODE PENERBANGAN / IATA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Contoh: GA - 980 atau SV - 819"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  RUTE &amp; TIPE PENERBANGAN
                </label>
                <input
                  type="text"
                  value={formRouteType}
                  onChange={(e) => setFormRouteType(e.target.value)}
                  placeholder="Contoh: Direct CGK - JED atau Transit Dubai (DXB)"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Maskapai Aktif (Tersedia untuk paket keberangkatan)
                  </span>
                </label>
              </div>

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
                  {editingId ? "Simpan Perubahan" : "Tambah Maskapai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
