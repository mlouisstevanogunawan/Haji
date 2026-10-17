"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { getJamaahList, type JamaahProfile } from "@/services/jamaahService";

interface JamaahBimbinganItem {
  id: string;
  kode: string;
  nama: string;
  gender: string;
  nik: string;
  phone: string;
  email: string;
  paspor: string;
  expDate: string;
  agen: string;
}

function formatPassportExpiry(value?: string): string {
  if (!value || value === "-") return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return `Exp ${parsed.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`;
}

function mapJamaahToItem(j: JamaahProfile): JamaahBimbinganItem {
  return {
    id: j.id,
    kode: j.code || "-",
    nama: j.name,
    gender: j.gender || "-",
    nik: j.nik || "-",
    phone: j.phone || "-",
    email: j.email || "-",
    paspor: j.passportNumber || "-",
    expDate: formatPassportExpiry(j.passportExpiry || undefined),
    agen: j.agent || "-",
  };
}

export default function JamaahBimbinganPage() {


  const [jamaahList, setJamaahList] = React.useState<JamaahBimbinganItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");

  // Modal Detail
  const [viewingItem, setViewingItem] = React.useState<JamaahBimbinganItem | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getJamaahList();
      setJamaahList((data || []).map(mapJamaahToItem));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memuat data jamaah dari Supabase:", err);
      setJamaahList([]);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm.trim().toLowerCase());
    setAppliedStatus(statusFilter);
  };

  const filteredData = jamaahList.filter((item) => {
    const q = appliedSearch;
    const matchesSearch =
      !q ||
      item.nama.toLowerCase().includes(q) ||
      item.kode.toLowerCase().includes(q) ||
      item.nik.includes(q) ||
      item.paspor.toLowerCase().includes(q);

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header matching Screenshot 4 */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Jamaah</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Jamaah</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Daftar jamaah umroh &amp; haji
        </p>
      </div>

      {/* Filter / Search Bar matching Screenshot 4 */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama / NIK / paspor"
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          Cari
        </button>
      </form>

      {/* Tabel Jamaah matching Screenshot 4 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KODE / NAMA
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  GENDER
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NIK
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KONTAK
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PASPOR
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  AGEN
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Memuat data jamaah dari Supabase...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    {loadError
                      ? `Gagal memuat data jamaah dari Supabase: ${loadError}`
                      : "Belum ada data jamaah tersimpan di Supabase."}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Kode & Nama */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-900">{item.nama}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.kode}</p>
                  </td>

                  {/* Gender */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {item.gender}
                    </span>
                  </td>

                  {/* NIK */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.nik}
                  </td>

                  {/* Kontak */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-teal-700 font-medium">{item.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.email}</p>
                  </td>

                  {/* Paspor */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-800">{item.paspor}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.expDate}</p>
                  </td>

                  {/* Agen */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.agen}
                  </td>

                  {/* Aksi (Hanya tombol Lihat) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/jamaah/${item.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Jamaah */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Detail Jamaah Bimbingan
              </h3>
              <button
                onClick={() => setViewingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Kode Jamaah</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{viewingItem.kode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nama Lengkap</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{viewingItem.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Jenis Kelamin</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">NIK (KTP)</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.nik}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nomor Telepon</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nomor Paspor</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.paspor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Kedaluwarsa Paspor</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.expDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Agen Mitra</p>
                  <p className="font-medium text-gray-800 mt-0.5">{viewingItem.agen}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pembimbing / Muthawif</p>
                  {/* Belum ada kolom muthawif pada data jamaah Supabase */}
                  <p className="font-medium text-teal-700 mt-0.5">-</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium text-sm px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
