"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getSystemSettings,
  saveSystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
} from "@/services/systemSettingsService";

export default function WhiteLabelPage() {


  // Form states — initial kosong, diisi dari database (satu-satunya sumber kebenaran).
  const [appName, setAppName] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [footerText, setFooterText] = React.useState("");

  const [primaryColor, setPrimaryColor] = React.useState("");
  const [secondaryColor, setSecondaryColor] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [faviconUrl, setFaviconUrl] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: "success" | "error"; text: string } | null>(null);

  const showToast = (kind: "success" | "error", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  // Branding dimuat dari database. Tidak ada cermin localStorage — tidak ada
  // komponen lain yang membacanya, dan localStorage bukan basis data.
  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await getSystemSettings();
        if (cancelled) return;
        setAppName(data.travelName ?? "");
        setSubtitle(data.subtitle ?? "");
        setPhone(data.supportPhone ?? "");
        setEmail(data.supportEmail ?? "");
        setAddress(data.headOfficeAddress ?? "");
        setFooterText(data.footerText ?? "");
        setPrimaryColor(data.primaryColor ?? "");
        setSecondaryColor(data.secondaryColor ?? "");
        setLogoUrl(data.logoUrl ?? "");
        setFaviconUrl(data.faviconUrl ?? "");
      } catch (err) {
        console.warn("Gagal memuat branding dari database:", err);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tidak ada endpoint Supabase Storage di proyek ini, jadi file dibaca sebagai
  // data URL (string) dan disimpan ke kolom teks logo_url / favicon_url.
  const readFileAsDataUrl = (
    e: React.ChangeEvent<HTMLInputElement>,
    apply: (value: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", `Ukuran ${label} melebihi 2MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => apply(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => showToast("error", `Gagal membaca ${label}.`);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await saveSystemSettings({
        ...DEFAULT_SYSTEM_SETTINGS,
        travelName: appName,
        supportPhone: phone,
        supportEmail: email,
        headOfficeAddress: address,
        subtitle: subtitle,
        footerText: footerText,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
      });

      showToast("success", "Pengaturan white-label berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      showToast("error", `Gagal menyimpan pengaturan: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate initials for preview icon
  const appInitials =
    appName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "TU";

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/dashboard" className="hover:text-gray-600 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <span className="text-gray-500 font-medium">White-label</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan White-label</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Branding tampil di seluruh aplikasi (cache otomatis diperbarui).
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition ${
            notice.kind === "success"
              ? "bg-teal-50 border-teal-200 text-teal-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notice.kind === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Main 2-column layout matching Screenshot 4: Left Form (70%), Right Preview (30%) */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column (Cards Identitas + Warna & Logo) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Identitas */}
          <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Identitas
            </h2>

            {/* Nama Aplikasi * & Subjudul */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Aplikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subjudul</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
                />
              </div>
            </div>

            {/* Telepon & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
              />
            </div>

            {/* Teks Footer */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Teks Footer</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs transition"
              />
            </div>
          </div>

          {/* Card: Warna & Logo */}
          <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Warna &amp; Logo
            </h2>

            {/* Warna Utama & Warna Sekunder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Warna Utama (hex) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 bg-white shadow-2xs">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "#0d9488"}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-7 w-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#0d9488"
                    className="flex-1 text-sm text-gray-900 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Warna Sekunder (hex) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 bg-white shadow-2xs">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(secondaryColor) ? secondaryColor : "#14b8a6"}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-7 w-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#14b8a6"
                    className="flex-1 text-sm text-gray-900 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Logo & Favicon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Logo (PNG/JPG, maks 2MB)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => readFileAsDataUrl(e, setLogoUrl, "logo")}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Tersimpan sebagai string data/URL di kolom logo_url (tidak ada storage file).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Favicon</label>
                <input
                  type="file"
                  accept="image/png, image/x-icon, image/jpeg"
                  onChange={(e) => readFileAsDataUrl(e, setFaviconUrl, "favicon")}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Tersimpan sebagai string data/URL di kolom favicon_url.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (Card: Pratinjau) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-200/90 rounded-lg p-6 shadow-2xs space-y-5 sticky top-20">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Pratinjau
            </h2>

            {/* Live Branding Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="App Logo"
                  className="h-10 w-10 rounded-lg object-cover shadow-2xs"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "#0d9488" }}
                >
                  {appInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {appName || "Travel Umroh & Haji"}
                </p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-tight">
                  {subtitle || "Sistem Manajemen Umroh & Haji"}
                </p>
              </div>
            </div>

            {/* Simpan Pengaturan Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50 text-center"
            >
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
