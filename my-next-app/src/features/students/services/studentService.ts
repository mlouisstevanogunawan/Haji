import { Pilgrim } from "@/types/database.types";
import { PaymentStatus } from "@/types/common.types";
import { PilgrimFormData } from "../types/student.types";
import { dbRead, dbUpsert, dbUpdate, dbDelete } from "@/lib/db/write";

// Petakan field form ke kolom `profiles` yang nyata. City -> address, paymentStatus -> status.
function mapPilgrimColumns(input: PilgrimFormData & Partial<Pilgrim>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.fullName) out.full_name = input.fullName;
  if (input.email) out.email = input.email;
  if (input.phone) out.phone = input.phone;
  if (input.gender) out.gender = input.gender;
  if (input.nik) out.nik = input.nik;
  if (input.passportNumber) out.passport_number = input.passportNumber;
  if (input.city) out.address = input.city;
  if (input.paymentStatus) out.status = input.paymentStatus;
  return out;
}

const PAYMENT_STATUSES: PaymentStatus[] = ["Lunas", "DP", "Belum Bayar"];

export async function getPilgrims(): Promise<Pilgrim[]> {
  const rows = await dbRead<Record<string, any>>("profiles", {
    select: "*",
    in: { role: ["jamaah", "jamaah_umroh"] },
    order: "created_at",
    desc: true,
  });

  // Semua nilai diambil dari kolom `profiles`. Field yang belum punya kolom
  // (paket, keberangkatan, visa, pembayaran) sengaja diberi nilai kosong, bukan
  // contoh, supaya UI tidak menampilkan angka yang tidak ada di database.
  return rows.map((p) => ({
    id: p.id,
    fullName: p.full_name || p.email || "Jamaah",
    passportNumber: p.passport_number || "-",
    nik: p.nik || "-",
    gender: (p.gender === "Perempuan" ? "Perempuan" : "Laki-laki") as
      | "Laki-laki"
      | "Perempuan",
    phone: p.phone || "-",
    email: p.email || "-",
    city: p.address || "-",
    packageId: "",
    packageName: "-",
    departureDate: "-",
    paymentStatus: (PAYMENT_STATUSES.includes(p.status) ? p.status : "Belum Bayar") as PaymentStatus,
    totalPaid: 0,
    remainingAmount: 0,
    visaStatus: "Pending" as const,
    documentStatus: "Belum Lengkap" as const,
    registrationDate: p.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  }));
}

export async function createPilgrim(input: PilgrimFormData): Promise<Pilgrim> {
  const columns = mapPilgrimColumns(input);
  const email = input.email || `jamaah.${Date.now()}@travel.com`;
  const fullName = input.fullName || "Jamaah";
  columns.email = email;
  columns.full_name = fullName;
  columns.role = "jamaah";
  columns.is_active = true;

  // profiles.id FK ke auth.users; daftarkan user auth nyata lewat /api/users
  // (service-role) lebih dulu supaya insert profil tidak kena FK 23503.
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: crypto.randomUUID(),
      full_name: fullName,
      role: "jamaah",
      phone: input.phone ?? null,
      is_active: true,
    }),
  });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Gagal membuat akun jamaah");
  }
  const id = json.data.id as string;

  const data = await dbUpsert<{ id: string; full_name: string | null }>(
    "profiles",
    { ...columns, id },
    { id }
  );

  return {
    id: data.id,
    fullName: data.full_name || input.fullName,
    passportNumber: input.passportNumber.toUpperCase(),
    nik: input.nik,
    gender: input.gender,
    phone: input.phone,
    email: input.email,
    city: input.city,
    packageId: input.packageId,
    packageName: "Paket Umroh Terpilih",
    departureDate: "2026-11-15",
    paymentStatus: input.paymentStatus,
    totalPaid: input.totalPaid,
    remainingAmount: 0,
    visaStatus: input.visaStatus,
    documentStatus: input.documentStatus,
    registrationDate: new Date().toISOString().split("T")[0],
    notes: input.notes,
  };
}

export async function updatePilgrim(id: string, input: PilgrimFormData): Promise<Pilgrim> {
  const data = await dbUpdate<{ id: string; full_name: string | null }>(
    "profiles",
    id,
    mapPilgrimColumns(input)
  );

  return {
    id: data.id,
    fullName: data.full_name || input.fullName,
    passportNumber: input.passportNumber.toUpperCase(),
    nik: input.nik,
    gender: input.gender,
    phone: input.phone,
    email: input.email,
    city: input.city,
    packageId: input.packageId,
    packageName: "Paket Umroh",
    departureDate: "2026-11-15",
    paymentStatus: input.paymentStatus,
    totalPaid: input.totalPaid,
    remainingAmount: 0,
    visaStatus: input.visaStatus,
    documentStatus: input.documentStatus,
    registrationDate: new Date().toISOString().split("T")[0],
    notes: input.notes,
  };
}

export async function deletePilgrim(id: string): Promise<boolean> {
  return dbDelete("profiles", id);
}
