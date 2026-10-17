"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getJamaahList, JamaahProfile } from "@/services/jamaahService";

interface JamaahDetailData {
  id: string;
  code: string;
  name: string;
  gender: string;
  nik: string;
  birthPlaceAndDate: string;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  passportNumber: string;
  passportIssuePlace: string;
  passportIssueDate: string;
  passportExpiry: string;
  mahramName: string;
  mahramRelation: string;
  emergencyContact: string;
  emergencyPhone: string;
  healthNotes: string;
  packageName: string;
  packageCodeAndDate: string;
  packageStatus: string;
  status: string;
  branch: string;
  agent: string;
  hasAccount: boolean;
  documentsCount: string;
}

// Hanya kolom yang benar-benar tersedia di profil Supabase yang diisi;
// lainnya kosong (tidak ada sumber datanya di `profiles`, tidak dikarang-karang).
function mapProfileToDetail(p: JamaahProfile): JamaahDetailData {
  return {
    id: p.id,
    code: p.code || "",
    name: p.name || "",
    gender: p.gender || "",
    nik: p.nik || "",
    birthPlaceAndDate: "",
    bloodType: "",
    phone: p.phone || "",
    email: p.email || "",
    address: "",
    passportNumber: p.passportNumber || "",
    passportIssuePlace: "",
    passportIssueDate: "",
    passportExpiry: p.passportExpiry || "",
    mahramName: "",
    mahramRelation: "",
    emergencyContact: "",
    emergencyPhone: "",
    healthNotes: "",
    packageName: "",
    packageCodeAndDate: "",
    packageStatus: "",
    status: p.status || "",
    branch: p.branch || "",
    agent: p.agent || "",
    hasAccount: false,
    documentsCount: "",
  };
}

export default function DetailJamaahPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [data, setData] = React.useState<JamaahDetailData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [notFound, setNotFound] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>("");

  React.useEffect(() => {
    async function loadJamaahDetail() {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);
      setLoadError("");
      try {
        const list: JamaahProfile[] = await getJamaahList();
        const found = list.find((item) => item.id === id);
        if (!found) {
          setNotFound(true);
          return;
        }
        setData(mapProfileToDetail(found));
      } catch (err: unknown) {
        console.error("Gagal memuat detail jamaah:", err);
        setLoadError((err as Error).message || "Gagal memuat detail jamaah.");
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadJamaahDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-sm text-gray-500">
          Memuat data jamaah...
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
            href="/jamaah-bimbingan"
            className="inline-flex rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2 transition shadow-sm"
          >
            Kembali ke Daftar Jamaah
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header Section with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-gray-900 transition">
              Beranda
            </Link>
            <span>&gt;</span>
            <Link href="/jamaah-bimbingan" className="hover:text-gray-900 transition">
              Jamaah
            </Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">{data.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{data.code}</p>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* Left Column (70%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Data Pribadi */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Data Pribadi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <p className="text-gray-400 font-medium mb-1">Jenis Kelamin</p>
                {data.gender === "Perempuan" ? (
                  <span className="inline-flex items-center rounded-full bg-pink-100 text-pink-700 px-2.5 py-0.5 text-xs font-medium">
                    Perempuan
                  </span>
                ) : data.gender === "Laki-laki" ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                    Laki-laki
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">NIK</p>
                <p className="font-mono text-gray-800">{data.nik || "-"}</p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Tempat / Tanggal Lahir
                </p>
                <p className="font-medium text-gray-800">
                  {data.birthPlaceAndDate || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">Golongan Darah</p>
                <p className="font-medium text-gray-800">{data.bloodType || "-"}</p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">Telepon</p>
                <p className="font-medium text-teal-600">{data.phone || "-"}</p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">Email</p>
                <p className="font-medium text-gray-800">{data.email || "-"}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-gray-400 font-medium mb-1">Alamat</p>
                <p className="font-medium text-gray-800">{data.address || "-"}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Paspor */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Paspor
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <p className="text-gray-400 font-medium mb-1">Nomor Paspor</p>
                <p className="font-mono font-medium text-gray-800">
                  {data.passportNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Tempat Penerbitan
                </p>
                <p className="font-medium text-gray-800">
                  {data.passportIssuePlace || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">Tanggal Terbit</p>
                <p className="font-medium text-gray-800">
                  {data.passportIssueDate || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Tanggal Kadaluarsa
                </p>
                <p className="font-medium text-gray-800">{data.passportExpiry || "-"}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Mahram & Kontak Darurat */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Mahram &amp; Kontak Darurat
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <p className="text-gray-400 font-medium mb-1">Nama Mahram</p>
                <p className="font-medium text-gray-800">{data.mahramName || "-"}</p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Hubungan Mahram
                </p>
                <p className="font-medium text-gray-800">
                  {data.mahramRelation || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">Kontak Darurat</p>
                <p className="font-medium text-gray-800">
                  {data.emergencyContact || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Telepon Darurat
                </p>
                <p className="font-medium text-gray-800">
                  {data.emergencyPhone || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Kesehatan */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Kesehatan
            </h2>

            <p className="text-xs text-gray-600">{data.healthNotes || "-"}</p>
          </div>

          {/* Card 5: Pendaftaran Paket */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Pendaftaran Paket
            </h2>

            {data.packageName ? (
              <div className="flex items-center justify-between border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {data.packageName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {data.packageCodeAndDate}
                  </p>
                </div>

                <div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                    {data.packageStatus}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Belum ada data pendaftaran paket.</p>
            )}
          </div>
        </div>

        {/* Right Column (30%) - Ringkasan */}
        <div className="lg:col-span-3 w-full">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Ringkasan
            </h2>

            <div className="space-y-4 text-xs divide-y divide-gray-100">
              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500">Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                  {data.status || "-"}
                </span>
              </div>

              {/* Cabang */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-gray-500">Cabang</span>
                <span className="font-medium text-gray-800 text-right">
                  {data.branch || "-"}
                </span>
              </div>

              {/* Agen */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-gray-500">Agen</span>
                <span className="font-medium text-gray-800">{data.agent || "-"}</span>
              </div>

              {/* Akun Login */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-gray-500">Akun Login</span>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                  {data.hasAccount ? "Aktif" : "Belum Ada"}
                </span>
              </div>

              {/* Dokumen */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-gray-500">Dokumen</span>
                <span className="font-medium text-gray-800">
                  {data.documentsCount || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
