"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pilgrim } from "@/types/database.types";
import { PilgrimFormData, pilgrimFormSchema } from "../types/student.types";
import { getPackages, PackageRow } from "@/services/packageService";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PilgrimFormData) => Promise<void>;
  initialData?: Pilgrim | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [packages, setPackages] = React.useState<PackageRow[]>([]);
  const [formData, setFormData] = React.useState<PilgrimFormData>({
    fullName: "",
    passportNumber: "",
    nik: "",
    gender: "Laki-laki",
    phone: "",
    email: "",
    city: "",
    packageId: "",
    paymentStatus: "DP",
    totalPaid: 10000000,
    visaStatus: "Pending",
    documentStatus: "Belum Lengkap",
    notes: "",
  });

  React.useEffect(() => {
    getPackages().then((pkgs) => {
      setPackages(pkgs);
      if (pkgs.length > 0 && !formData.packageId) {
        setFormData((prev) => ({ ...prev, packageId: pkgs[0].id }));
      }
    }).catch(() => {});
  }, []);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        passportNumber: initialData.passportNumber,
        nik: initialData.nik,
        gender: initialData.gender,
        phone: initialData.phone,
        email: initialData.email,
        city: initialData.city,
        packageId: initialData.packageId,
        paymentStatus: initialData.paymentStatus,
        totalPaid: initialData.totalPaid,
        visaStatus: initialData.visaStatus,
        documentStatus: initialData.documentStatus,
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        fullName: "",
        passportNumber: "",
        nik: "",
        gender: "Laki-laki",
        phone: "",
        email: "",
        city: "",
        packageId: packages[0]?.id || "",
        paymentStatus: "DP",
        totalPaid: 10000000,
        visaStatus: "Pending",
        documentStatus: "Belum Lengkap",
        notes: "",
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseResult = pilgrimFormSchema.safeParse(formData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await onSubmit(parseResult.data);
      onClose();
    } catch {
      setErrors({ form: "Gagal menyimpan data jamaah. Coba lagi." });
    } finally {
      setIsLoading(false);
    }
  };

  const packageOptions = packages.map((p) => ({
    label: `${p.name} (${p.type})`,
    value: p.id,
  }));

  const genderOptions = [
    { label: "Laki-laki", value: "Laki-laki" },
    { label: "Perempuan", value: "Perempuan" },
  ];

  const paymentOptions = [
    { label: "Lunas", value: "Lunas" },
    { label: "DP Terbayar", value: "DP" },
    { label: "Belum Bayar", value: "Belum Bayar" },
  ];

  const visaOptions = [
    { label: "Approved (Disetujui)", value: "Approved" },
    { label: "Process (Diproses)", value: "Process" },
    { label: "Pending (Menunggu)", value: "Pending" },
    { label: "Rejected (Ditolak)", value: "Rejected" },
  ];

  const docOptions = [
    { label: "Lengkap", value: "Lengkap" },
    { label: "Diverifikasi", value: "Diverifikasi" },
    { label: "Belum Lengkap", value: "Belum Lengkap" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Ubah Data Jamaah Umroh" : "Pendaftaran Jamaah Baru"}
      description="Lengkapi informasi identitas paspor, paket keberangkatan, dan status visa jamaah."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2">
        {errors.form && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap Sesuai Paspor"
            placeholder="misal: Ahmad Fauzi Rahman"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            error={errors.fullName}
            required
          />

          <Input
            label="Nomor Paspor Resmi"
            placeholder="misal: C8921445"
            value={formData.passportNumber}
            onChange={(e) =>
              setFormData({ ...formData, passportNumber: e.target.value })
            }
            error={errors.passportNumber}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="NIK (Nomor Induk Kependudukan)"
            placeholder="16 digit NIK KTP"
            value={formData.nik}
            onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            error={errors.nik}
            maxLength={16}
            required
          />

          <Select
            label="Jenis Kelamin"
            options={genderOptions}
            value={formData.gender}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value as "Laki-laki" | "Perempuan",
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nomor WhatsApp / HP"
            placeholder="0812xxxxxxxx"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            error={errors.phone}
            required
          />

          <Input
            label="Email Aktif"
            type="email"
            placeholder="email@domain.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            required
          />

          <Input
            label="Kota Domisili"
            placeholder="Jakarta Selatan"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            error={errors.city}
            required
          />
        </div>

        <Select
          label="Pilihan Paket Umroh / Haji"
          options={packageOptions}
          value={formData.packageId}
          onChange={(e) =>
            setFormData({ ...formData, packageId: e.target.value })
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Status Pembayaran"
            options={paymentOptions}
            value={formData.paymentStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentStatus: e.target.value as any,
              })
            }
          />

          <Input
            label="Nominal Terbayar (Rp)"
            type="number"
            value={formData.totalPaid}
            onChange={(e) =>
              setFormData({ ...formData, totalPaid: Number(e.target.value) })
            }
            error={errors.totalPaid}
            required
          />

          <Select
            label="Status Visa Nusuk"
            options={visaOptions}
            value={formData.visaStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                visaStatus: e.target.value as any,
              })
            }
          />
        </div>

        <Select
          label="Kelengkapan Berkas Fisik"
          options={docOptions}
          value={formData.documentStatus}
          onChange={(e) =>
            setFormData({
              ...formData,
              documentStatus: e.target.value as any,
            })
          }
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Catatan Tambahan (Kamar, Permintaan Khusus, Riwayat Medis)
          </label>
          <textarea
            rows={2}
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="misal: Permintaan kamar berdua, butuh bantuan kursi roda saat tawaf"
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="default" size="sm" isLoading={isLoading}>
            {initialData ? "Simpan Perubahan" : "Daftarkan Jamaah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
