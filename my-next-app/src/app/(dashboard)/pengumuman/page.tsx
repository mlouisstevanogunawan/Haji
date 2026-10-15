"use client";

import * as React from "react";
import {
  Megaphone,
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  Calendar,
  ArrowLeft,
  Check,
} from "lucide-react";

import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  AnnouncementRow,
  AnnouncementAudience,
} from "@/services/announcementService";

interface AnnouncementItem {
  id: string;
  title: string;
  excerpt: string;
  targetAudience: "Semua Pengguna" | "Mitra Agen" | "Jamaah";
  branch: string;
  status: "Published" | "Draft";
  isLive: boolean;
  publishTime: string;
}

export default function PengumumanTravelPage() {
  const [announcements, setAnnouncements] = React.useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [audienceFilter, setAudienceFilter] = React.useState("Semua Audiens");
  const [isAdding, setIsAdding] = React.useState(false);

  // Form state matching Screenshot 1
  const [formTitle, setFormTitle] = React.useState("");
  const [formContent, setFormContent] = React.useState("");
  const [formAudience, setFormAudience] = React.useState<"Semua Pengguna" | "Mitra Agen" | "Jamaah">("Semua Pengguna");
  const [formBranch, setFormBranch] = React.useState("Semua Cabang (Nasional)");
  const [formPackage, setFormPackage] = React.useState("Umum (Semua Paket)");
  const [formPublishDate, setFormPublishDate] = React.useState("06/10/2026 00:45");
  const [formExpireDate, setFormExpireDate] = React.useState("");
  const [formIsPublished, setFormIsPublished] = React.useState(true);

  const loadAnnouncements = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAnnouncements();
      const mapped: AnnouncementItem[] = data.map((a) => {
        let aud: "Semua Pengguna" | "Mitra Agen" | "Jamaah" = "Semua Pengguna";
        if (a.target_audience === "agents") aud = "Mitra Agen";
        else if (a.target_audience === "jamaah") aud = "Jamaah";

        return {
          id: a.id,
          title: a.title,
          excerpt: a.content || "Informasi resmi travel umroh.",
          targetAudience: aud,
          branch: "Semua Cabang",
          status: a.is_published ? "Published" : "Draft",
          isLive: a.is_published,
          publishTime: a.published_at?.split("T")[0] || a.created_at?.split("T")[0] || "Hari ini",
        };
      });
      setAnnouncements(mapped);
    } catch (err: any) {
      console.error("Failed to load announcements from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const filteredList = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (audienceFilter === "Semua Audiens") return matchesSearch;
    return matchesSearch && item.targetAudience === audienceFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    let audDb: AnnouncementAudience = "all";
    if (formAudience === "Mitra Agen") audDb = "agents";
    else if (formAudience === "Jamaah") audDb = "jamaah";

    try {
      await createAnnouncement({
        title: formTitle,
        content: formContent || "Informasi pengumuman resmi.",
        target_audience: audDb,
        is_published: formIsPublished,
        published_at: formIsPublished ? new Date().toISOString() : null,
      });

      setIsAdding(false);
      setFormTitle("");
      setFormContent("");
      await loadAnnouncements();
    } catch (err: any) {
      alert(`Gagal menerbitkan pengumuman: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini dari database?")) {
      try {
        await deleteAnnouncement(id);
        await loadAnnouncements();
      } catch (err: any) {
        alert(`Gagal menghapus pengumuman: ${err.message}`);
      }
    }
  };

  // If in Add Mode, show EXACT form from Screenshot 1
  if (isAdding) {
    return (
      <div className="space-y-6 pb-16 max-w-4xl">
        {/* Header section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Tambah Pengumuman Baru
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Terbitkan informasi atau instruksi penting kepada audiens terarah
          </p>
        </div>

        {/* Card: Informasi Pengumuman Baru */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-3">
            Informasi Pengumuman Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Judul Pengumuman */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Judul Pengumuman <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Jadwal Manasik Akbar Syawal 1447H"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Isi Pengumuman */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Isi Pengumuman <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Tuliskan isi pengumuman atau instruksi penting kepada audiens.."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>

            {/* Target Audiens & Cabang Tertarget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Target Audiens <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option value="Semua Pengguna">Semua Pengguna</option>
                    <option value="Mitra Agen">Mitra Agen</option>
                    <option value="Jamaah">Jamaah</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cabang Tertarget
                </label>
                <div className="relative">
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  >
                    <option>Semua Cabang (Nasional)</option>
                    <option>Kantor Pusat Jakarta</option>
                    <option>Cabang Bandung</option>
                    <option>Cabang Surabaya</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Terkait Paket Tertentu (Opsional) */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Terkait Paket Tertentu (Opsional)
              </label>
              <div className="relative">
                <select
                  value={formPackage}
                  onChange={(e) => setFormPackage(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                >
                  <option>Umum (Semua Paket)</option>
                  <option>Umroh Reguler Syawal 1447H</option>
                  <option>Umroh Ramadhan Berkah I'tikaf</option>
                  <option>Haji Khusus Furoda VIP</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Tayang Mulai & Kedaluwarsa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tayang Mulai (Waktu Terbit)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formPublishDate}
                    onChange={(e) => setFormPublishDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kedaluwarsa (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy -- : --"
                    value={formExpireDate}
                    onChange={(e) => setFormExpireDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Checkbox Terbitkan Pengumuman */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    Terbitkan Pengumuman (Publikasikan Langsung)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bila tidak dicentang, pengumuman tersimpan sebagai Draft dan belum tampak oleh audiens.
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Megaphone className="h-4 w-4" />
                <span>Terbitkan Pengumuman</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 text-xs font-semibold transition shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Batal</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default: Table view
  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Pengumuman
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Kelola pengumuman &amp; edaran resmi untuk staf, agen mitra, dan jamaah
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul, isi pengumuman..."
              className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Audiens</option>
              <option>Semua Pengguna</option>
              <option>Mitra Agen</option>
              <option>Jamaah</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengumuman</span>
        </button>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">JUDUL &amp; TERKAIT</th>
                <th className="pb-3.5 font-bold">TARGET AUDIENS</th>
                <th className="pb-3.5 font-bold">CABANG</th>
                <th className="pb-3.5 font-bold">STATUS PUBLIKASI</th>
                <th className="pb-3.5 font-bold">MULAI TAYANG</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  {/* Judul & Terkait */}
                  <td className="py-3.5 pr-4 max-w-sm">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.excerpt}
                    </p>
                  </td>

                  {/* Target Audiens */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        item.targetAudience === "Semua Pengguna"
                          ? "bg-purple-50 text-purple-700 border-purple-200/60"
                          : item.targetAudience === "Mitra Agen"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-blue-50 text-blue-700 border-blue-200/60"
                      }`}
                    >
                      {item.targetAudience}
                    </span>
                  </td>

                  {/* Cabang */}
                  <td className="py-3.5 pr-4 text-slate-700 font-medium whitespace-nowrap">
                    {item.branch}
                  </td>

                  {/* Status Publikasi */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                      <span>Published</span>
                      {item.isLive && (
                        <span className="flex items-center gap-1 font-bold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Mulai Tayang */}
                  <td className="py-3.5 pr-4 text-slate-600 whitespace-nowrap">
                    {item.publishTime}
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 text-slate-400">
                      <button
                        title="Ubah Pengumuman"
                        className="p-1 hover:text-slate-700 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Hapus"
                        className="p-1 hover:text-red-600 transition"
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
    </div>
  );
}
