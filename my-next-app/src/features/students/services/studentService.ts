import { Pilgrim } from "@/types/database.types";
import { PilgrimFormData } from "../types/student.types";
import { createClient } from "@/lib/supabase/client";

export async function getPilgrims(): Promise<Pilgrim[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["jamaah", "jamaah_umroh"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pilgrims from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name || p.email || "Jamaah",
    passportNumber: p.raw_user_meta_data?.passportNumber || "-",
    nik: p.raw_user_meta_data?.nik || "-",
    gender: (p.raw_user_meta_data?.gender as "Laki-laki" | "Perempuan") || "Laki-laki",
    phone: p.phone || "-",
    email: p.email || "-",
    city: p.raw_user_meta_data?.city || "Jakarta",
    packageId: p.raw_user_meta_data?.packageId || "",
    packageName: p.raw_user_meta_data?.packageName || "Umroh Reguler",
    departureDate: p.raw_user_meta_data?.departureDate || "2026-11-15",
    paymentStatus: (p.raw_user_meta_data?.paymentStatus as any) || "Lunas",
    totalPaid: Number(p.raw_user_meta_data?.totalPaid) || 0,
    remainingAmount: Number(p.raw_user_meta_data?.remainingAmount) || 0,
    visaStatus: (p.raw_user_meta_data?.visaStatus as any) || "Pending",
    documentStatus: (p.raw_user_meta_data?.documentStatus as any) || "Diverifikasi",
    registrationDate: p.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    notes: p.raw_user_meta_data?.notes,
  }));
}

export async function createPilgrim(input: PilgrimFormData): Promise<Pilgrim> {
  const supabase = createClient();
  const id = crypto.randomUUID();

  const newProfile = {
    id,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email || `jamaah.${Date.now()}@travel.com`,
    role: "jamaah",
    is_active: true,
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert([newProfile])
    .select()
    .single();

  if (error) {
    console.error("Error creating pilgrim in Supabase:", error.message);
    throw new Error(error.message);
  }

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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating pilgrim in Supabase:", error.message);
    throw new Error(error.message);
  }

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
  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting pilgrim in Supabase:", error.message);
    throw new Error(error.message);
  }

  return true;
}
