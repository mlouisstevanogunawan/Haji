import { createClient } from "@/lib/supabase/client";

export interface JamaahProfile {
  id: string;
  code?: string;
  name: string;
  gender?: "Laki-laki" | "Perempuan";
  nik?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  isPassportExpiringSoon?: boolean;
  branch?: string;
  agent?: string;
  status?: string;
  email?: string;
  created_at?: string;
}

export async function getJamaahList(): Promise<JamaahProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["jamaah", "jamaah_umroh"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jamaah profiles from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    code: p.raw_user_meta_data?.code || `PLG-${p.id.slice(0, 8).toUpperCase()}`,
    name: p.full_name || p.email || "Jamaah",
    gender: p.raw_user_meta_data?.gender || "Laki-laki",
    nik: p.raw_user_meta_data?.nik || "-",
    phone: p.phone || "-",
    passportNumber: p.raw_user_meta_data?.passportNumber || "-",
    passportExpiry: p.raw_user_meta_data?.passportExpiry || "-",
    isPassportExpiringSoon: Boolean(p.raw_user_meta_data?.isPassportExpiringSoon),
    branch: p.raw_user_meta_data?.branch || "Kantor Pusat Jakarta",
    agent: p.raw_user_meta_data?.agent || "Langsung",
    status: p.raw_user_meta_data?.status || "Lunas",
    email: p.email || "",
    created_at: p.created_at,
  }));
}

export async function createJamaah(payload: Partial<JamaahProfile>): Promise<JamaahProfile> {
  const supabase = createClient();
  const id = crypto.randomUUID();
  const newProfile = {
    id,
    email: payload.email || `jamaah.${Date.now()}@travel.com`,
    full_name: payload.name,
    phone: payload.phone,
    role: "jamaah",
    is_active: true,
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert([newProfile])
    .select()
    .single();

  if (error) {
    console.error("Error creating jamaah profile:", error.message);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    code: `PLG-${data.id.slice(0, 8).toUpperCase()}`,
    name: data.full_name || "",
    gender: payload.gender || "Laki-laki",
    nik: payload.nik || "-",
    phone: data.phone || "-",
    passportNumber: payload.passportNumber || "-",
    passportExpiry: payload.passportExpiry || "-",
    branch: payload.branch || "Kantor Pusat Jakarta",
    agent: payload.agent || "Langsung",
    status: payload.status || "Lunas",
    email: data.email || "",
    created_at: data.created_at,
  };
}

export async function updateJamaah(id: string, payload: Partial<JamaahProfile>): Promise<boolean> {
  const supabase = createClient();
  const updatePayload: Record<string, any> = {};
  if (payload.name) updatePayload.full_name = payload.name;
  if (payload.phone) updatePayload.phone = payload.phone;
  if (payload.email) updatePayload.email = payload.email;

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Error updating jamaah profile:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function deleteJamaah(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    console.error("Error deleting jamaah profile:", error.message);
    throw new Error(error.message);
  }

  return true;
}
