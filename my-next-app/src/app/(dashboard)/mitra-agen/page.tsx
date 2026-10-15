"use client";

import * as React from "react";
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Percent,
} from "lucide-react";

import {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  AgentRow,
} from "@/services/agentService";

export interface AgentItem {
  id: string;
  name: string;
  code: string;
  branch: string;
  commissionRate: string; // e.g. "5%"
  phone: string;
  email: string;
  status: "Aktif" | "Nonaktif";
}

export default function MitraAgenPage() {
  const [agents, setAgents] = React.useState<AgentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = React.useState("");
  const [formCode, setFormCode] = React.useState("AGN-002");
  const [formBranch, setFormBranch] = React.useState("Kantor Pusat Jakarta");
  const [formCommission, setFormCommission] = React.useState("5");
  const [formPhone, setFormPhone] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState<boolean>(true);

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadAgents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAgents();
      const mapped: AgentItem[] = data.map((a, idx) => ({
        id: a.id,
        name: a.name,
        code: `AGN-00${idx + 1}`,
        branch: "Kantor Pusat Jakarta",
        commissionRate: `${Math.round(Number(a.commission_rate) * 100 || 5)}%`,
        phone: a.phone || "-",
        email: a.email || "-",
        status: a.is_active ? "Aktif" : "Nonaktif",
      }));
      setAgents(mapped);
    } catch (err: any) {
      console.error("Failed to load agents from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormCode(`AGN-00${agents.length + 1}`);
    setFormBranch("Kantor Pusat Jakarta");
    setFormCommission("5");
    setFormPhone("");
    setFormEmail("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AgentItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCode(item.code);
    setFormBranch(item.branch);
    setFormCommission(item.commissionRate.replace("%", "").trim());
    setFormPhone(item.phone);
    setFormEmail(item.email);
    setFormIsActive(item.status === "Aktif");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const rateNumeric = (parseFloat(formCommission) || 5) / 100;

    try {
      if (editingId) {
        await updateAgent(editingId, {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, ".")}@travel.com`,
          commission_rate: rateNumeric,
          is_active: formIsActive,
        });
        showToast("Data mitra agen berhasil diperbarui di database!");
      } else {
        await createAgent({
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, ".")}@travel.com`,
          commission_rate: rateNumeric,
          is_active: formIsActive,
        });
        showToast("Mitra agen baru berhasil ditambahkan ke database Supabase!");
      }
      setIsModalOpen(false);
      await loadAgents();
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mitra agen "${name}" dari database?`)) {
      try {
        await deleteAgent(id);
        showToast("Mitra agen berhasil dihapus dari database.");
        await loadAgents();
      } catch (err: any) {
        showToast(`Gagal menghapus: ${err.message}`);
      }
    }
  };

  const filteredAgents = agents.filter((item) => {
    const q = appliedSearch.toLowerCase().trim();
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.branch.toLowerCase().includes(q)
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

      {/* Header section (Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <UserCheck className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Mitra Agen Travel
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manajemen database agen marketing referral, skema komisi, dan status keaktifan.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Mitra Agen</span>
        </button>
      </div>

      {/* Filter / Search Bar (Screenshot 2) */}
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
              placeholder="Cari agen, kode, no hp..."
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
          Total: {filteredAgents.length} agen terdaftar
        </span>
      </div>

      {/* Table Data (Screenshot 2) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">AGEN &amp; KODE</th>
                <th className="pb-3.5 font-bold">CABANG</th>
                <th className="pb-3.5 font-bold">RATE KOMISI</th>
                <th className="pb-3.5 font-bold">KONTAK</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAgents.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Agen & Kode */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 mt-0.5">
                      {item.code}
                    </span>
                  </td>

                  {/* Cabang */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.branch}</span>
                    </div>
                  </td>

                  {/* Rate Komisi */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60">
                      <Percent className="h-3 w-3" />
                      <span>{item.commissionRate}</span>
                    </span>
                  </td>

                  {/* Kontak */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>{item.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span>{item.email}</span>
                    </div>
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
                        title="Ubah Agen"
                        className="p-1 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Hapus Agen"
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

      {/* Modal Tambah/Edit Mitra Agen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? "Edit Mitra Agen" : "Tambah Mitra Agen Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Informasi agen marketing dan ketentuan komisi
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
                  NAMA LENGKAP AGEN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    KODE AGEN
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="AGN-002"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                    RATE KOMISI (%)
                  </label>
                  <input
                    type="number"
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  KANTOR CABANG NAUNGAN
                </label>
                <select
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option>Kantor Pusat Jakarta</option>
                  <option>Cabang Bandung</option>
                  <option>Cabang Surabaya</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  NOMOR WHATSAPP / HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081277778888"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Contoh: agen.ahmad@travel.com"
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    Mitra Agen Aktif (Bisa mendaftarkan jamaah &amp; terima komisi)
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
                  {editingId ? "Simpan Perubahan" : "Tambah Mitra Agen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
