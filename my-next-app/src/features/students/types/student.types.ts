import { Pilgrim, PaymentStatus, VisaStatus, DocumentStatus } from "@/types/database.types";
import { z } from "zod";

export const pilgrimFormSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  passportNumber: z.string().min(6, "Nomor paspor minimal 6 karakter").regex(/^[A-Z0-9]+$/i, "Format paspor alfanumerik"),
  nik: z.string().length(16, "NIK harus 16 digit angka").regex(/^[0-9]+$/, "NIK harus angka"),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  email: z.string().email("Format email tidak valid"),
  city: z.string().min(2, "Kota domisili harus diisi"),
  packageId: z.string().min(1, "Pilih paket umroh"),
  paymentStatus: z.enum(["Lunas", "DP", "Belum Bayar"]),
  totalPaid: z.number().min(0, "Jumlah bayar tidak boleh negatif"),
  visaStatus: z.enum(["Approved", "Process", "Pending", "Rejected"]),
  documentStatus: z.enum(["Lengkap", "Belum Lengkap", "Diverifikasi"]),
  notes: z.string().optional(),
});

export type PilgrimFormData = z.infer<typeof pilgrimFormSchema>;

export interface StudentFiltersState {
  search: string;
  paymentStatus: string;
  visaStatus: string;
  packageCategory: string;
}
