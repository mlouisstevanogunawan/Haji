"use client";

import * as React from "react";
import {
  Clock,
  Check,
  Wallet,
  X,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  getCommissions,
  updateCommission,
  CommissionWithDetails,
  CommissionStatus,
} from "@/services/commissionService";

interface KomisiItem {
  id: string;
  agen: string;
  jamaah: string;
  paket: string;
  dasar: number;
  rate: string;
  komisi: number;
  status: "Menunggu" | "Disetujui" | "Dibayar" | "Dibatalkan";
}

export default function KomisiAgenPage() {
  const [items, setItems] = React.useState<KomisiItem[]>([]);
  const [, setIsLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [agentFilter, setAgentFilter] = React.useState("Semua Agen");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");
  const [appliedAgent, setAppliedAgent] = React.useState("Semua Agen");

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getCommissions();
      const mapped: KomisiItem[] = (records || []).map((c) => {
        const stMap: Record<string, "Menunggu" | "Disetujui" | "Dibayar" | "Dibatalkan"> = {
          pending: "Menunggu",
          approved: "Disetujui",
          paid: "Dibayar",
          cancelled: "Dibatalkan",
        };
        const dasarVal = Number(c.bookings?.total_price || 0);
        const komisiVal = Number(c.amount || 0);
        // Rate lebih dulu diambil dari kolom agen.commission_rate yang asli,
        // baru dihitung dari nominal bila agen belum punya rate.
        const rateAgen = Number(c.agents?.commission_rate || 0);
        const calculatedRate =
          rateAgen > 0
            ? rateAgen.toFixed(2)
            : dasarVal > 0
            ? ((komisiVal / dasarVal) * 100).toFixed(2)
            : "0.00";

        return {
          id: c.id,
          agen: c.agents?.name || "-",
          jamaah: c.bookings?.profiles?.full_name || "-",
          paket: c.bookings?.packages?.name || "-",
          dasar: dasarVal,
          rate: `${calculatedRate}%`,
          komisi: komisiVal,
          status: stMap[c.status] || "Menunggu",
        };
      });
      setItems(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat data komisi:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic KPI Stats
  const menungguItems = items.filter((i) => i.status === "Menunggu");
  const disetujuiItems = items.filter((i) => i.status === "Disetujui");
  const dibayarItems = items.filter((i) => i.status === "Dibayar");
  const dibatalkanItems = items.filter((i) => i.status === "Dibatalkan");

  const menungguNominal = menungguItems.reduce((acc, i) => acc + i.komisi, 0);
  const disetujuiNominal = disetujuiItems.reduce((acc, i) => acc + i.komisi, 0);
  const dibayarNominal = dibayarItems.reduce((acc, i) => acc + i.komisi, 0);
  const dibatalkanNominal = dibatalkanItems.reduce((acc, i) => acc + i.komisi, 0);

  const handleApplyFilter = () => {
    setAppliedStatus(statusFilter);
    setAppliedAgent(agentFilter);
  };

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      appliedStatus === "Semua Status" ||
      item.status.toLowerCase() === appliedStatus.toLowerCase();
    const matchesAgent =
      appliedAgent === "Semua Agen" ||
      item.agen.toLowerCase() === appliedAgent.toLowerCase();
    return matchesStatus && matchesAgent;
  });

  const uniqueAgents = Array.from(new Set(items.map((i) => i.agen)));

  const reverseMap: Record<string, CommissionStatus> = {
    Menunggu: "pending",
    Disetujui: "pending",
    Dibayar: "paid",
    Dibatalkan: "cancelled",
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "Menunggu" | "Disetujui" | "Dibayar" | "Dibatalkan"
  ) => {
    const dbStatus = reverseMap[newStatus];
    if (!dbStatus) {
      console.error(`Status '${newStatus}' tidak dikenali oleh enum commission_status.`);
      return;
    }

    try {
      // Catatan: enum commission_status hanya punya pending/paid/cancelled, jadi
      // 'Disetujui' ditulis sebagai 'pending' — tabel di-load ulang dari database
      // supaya yang tampil adalah status yang benar-benar tersimpan.
      await updateCommission(id, { status: dbStatus });
      await loadData();
    } catch (err: unknown) {
      console.error("Gagal memperbarui status komisi:", err);
      alert(`Gagal memperbarui status komisi: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>Beranda</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Komisi Agen</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Komisi Agen</h1>
        <p className="text-sm text-gray-500">Rekap &amp; pembayaran komisi agen</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Menunggu */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Menunggu</p>
            <p className="text-lg font-bold text-gray-900">
              Rp {menungguNominal.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-400">{menungguItems.length} komisi</p>
          </div>
        </div>

        {/* Disetujui */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Disetujui</p>
            <p className="text-lg font-bold text-gray-900">
              Rp {disetujuiNominal.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-400">{disetujuiItems.length} komisi</p>
          </div>
        </div>

        {/* Dibayar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dibayar</p>
            <p className="text-lg font-bold text-gray-900">
              Rp {dibayarNominal.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-400">{dibayarItems.length} komisi</p>
          </div>
        </div>

        {/* Dibatalkan */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dibatalkan</p>
            <p className="text-lg font-bold text-gray-900">
              Rp {dibatalkanNominal.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-gray-400">{dibatalkanItems.length} komisi</p>
          </div>
        </div>
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
            <option>Menunggu</option>
            <option>Disetujui</option>
            <option>Dibayar</option>
            <option>Dibatalkan</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown Agen */}
        <div className="relative">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm min-w-[150px]"
          >
            <option>Semua Agen</option>
            {uniqueAgents.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
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
                  AGEN
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DASAR
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  RATE
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KOMISI
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Agen */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.agen}
                  </td>

                  {/* Jamaah */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.jamaah}
                  </td>

                  {/* Paket */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.paket}
                  </td>

                  {/* Dasar */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    Rp {item.dasar.toLocaleString("id-ID")}
                  </td>

                  {/* Rate */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    {item.rate}
                  </td>

                  {/* Komisi */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-normal">
                    Rp {item.komisi.toLocaleString("id-ID")}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status === "Menunggu" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Menunggu
                      </span>
                    )}
                    {item.status === "Disetujui" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Disetujui
                      </span>
                    )}
                    {item.status === "Dibayar" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Dibayar
                      </span>
                    )}
                    {item.status === "Dibatalkan" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Dibatalkan
                      </span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {item.status === "Dibayar" ? (
                      <span className="text-xs text-gray-400 font-normal italic pr-2">
                        Final
                      </span>
                    ) : (
                      <div className="relative inline-block text-left">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(
                                item.id,
                                e.target.value as
                                  | "Menunggu"
                                  | "Disetujui"
                                  | "Dibayar"
                                  | "Dibatalkan"
                              );
                            }
                          }}
                          className="appearance-none bg-white border border-gray-300 rounded-lg px-2.5 py-1 pr-6 text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
                        >
                          <option value="">Ubah status...</option>
                          <option value="Menunggu">Menunggu</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Dibayar">Dibayar</option>
                          <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                    )}
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
