import { dbRead, dbUpsert, dbUpdate, dbDelete } from "@/lib/db/write";

export interface JamaahProfile {
  id: string;
  code?: string;
  name: string;
  gender?: "Laki-laki" | "Perempuan" | null;
  nik?: string | null;
  phone?: string | null;
  email?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  bloodType?: string | null;
  city?: string | null;
  address?: string | null;
  passportNumber?: string | null;
  passportIssuePlace?: string | null;
  passportIssueDate?: string | null;
  passportExpiry?: string | null;
  isPassportExpiringSoon?: boolean;
  mahramName?: string | null;
  mahramRelation?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  healthNotes?: string | null;
  branch?: string | null;
  branchId?: string | null;
  agent?: string | null;
  status?: string | null;
  is_active?: boolean;
  created_at?: string;
}

function isExpiringSoon(passportExpiry: string | null): boolean {
  if (!passportExpiry) return false;
  const expiry = new Date(passportExpiry).getTime();
  if (Number.isNaN(expiry)) return false;
  return expiry - Date.now() < 180 * 24 * 60 * 60 * 1000;
}

export async function getJamaahList(): Promise<JamaahProfile[]> {
  // Lewat proxy service-role: policy SELECT profiles menuntut auth.uid()/admin.
  // Untuk sesi jamaah, /api/db memaksa filter id = user login sehingga daftar
  // ini hanya berisi dirinya sendiri.
  const [data, branches] = await Promise.all([
    dbRead<any>("profiles", {
      select: "*",
      in: { role: ["jamaah", "jamaah_umroh"] },
      order: "created_at",
      desc: true,
    }),
    dbRead<{ id: string; name: string }>("branches", { select: "id, name" }),
  ]);

  const branchNames = new Map(branches.map((b) => [b.id, b.name]));

  // Sumber data adalah kolom asli profiles, bukan raw_user_meta_data (kolom itu
  // ada di auth.users, bukan di profiles, jadi selalu undefined di sini).
  return data.map((p: any) => ({
    id: p.id,
    code: `PLG-${p.id.slice(0, 8).toUpperCase()}`,
    name: p.full_name || p.email || "Jamaah",
    gender: p.gender === "Perempuan" ? "Perempuan" : "Laki-laki",
    nik: p.nik || "-",
    phone: p.phone || "-",
    birthPlace: p.birth_place || "",
    birthDate: p.birth_date || "",
    bloodType: p.blood_type || "",
    city: p.city || "",
    address: p.address || "",
    passportNumber: p.passport_number || "-",
    passportIssuePlace: p.passport_issue_place || "",
    passportIssueDate: p.passport_issue_date || "",
    passportExpiry: p.passport_expiry || "-",
    isPassportExpiringSoon: isExpiringSoon(p.passport_expiry),
    mahramName: p.mahram_name || "",
    mahramRelation: p.mahram_relation || "",
    emergencyContactName: p.emergency_contact_name || "",
    emergencyContactPhone: p.emergency_contact_phone || "",
    healthNotes: p.health_notes || "",
    branch: branchNames.get(p.branch_id) || "-",
    agent: p.agent_code || "-",
    status: p.status || "Belum Bayar",
    email: p.email || "",
    created_at: p.created_at,
  }));
}

// Petakan field form (camelCase ATAU snake_case) ke kolom `profiles` yang nyata.
// `allowClear` dipakai jalur update: field yang dikirim sebagai string kosong
// memang dihapus nilainya di database, sedangkan field yang tidak dikirim sama
// sekali (undefined) tetap dibiarkan apa adanya.
function mapProfileFields(
  input: Partial<JamaahProfile> & Record<string, unknown>,
  allowClear = false
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (col: string, ...keys: string[]) => {
    for (const key of keys) {
      const value = input[key];
      if (value === undefined) continue;
      if (value === null || value === "") {
        if (allowClear) out[col] = null;
        return;
      }
      out[col] = value;
      return;
    }
  };
  // Kolom tanggal bertipe date di Postgres; nilai seperti "Exp 2027-03-01" dari
  // form lama akan ditolak Postgres dan menggagalkan seluruh INSERT.
  const setDate = (col: string, ...keys: string[]) => {
    for (const key of keys) {
      const raw = input[key];
      if (raw === undefined) continue;
      if (raw === null || raw === "") {
        if (allowClear) out[col] = null;
        return;
      }
      const match = String(raw).match(/\d{4}-\d{2}-\d{2}/);
      if (match) out[col] = match[0];
      return;
    }
  };
  set("full_name", "name", "full_name");
  set("email", "email");
  set("phone", "phone");
  set("gender", "gender");
  set("nik", "nik");
  set("passport_number", "passportNumber", "passport_number");
  setDate("passport_expiry", "passportExpiry", "passport_expiry");
  set("status", "status");
  set("city", "city");
  set("address", "address", "domisili");
  set("birth_place", "birthPlace", "birth_place");
  setDate("birth_date", "birthDate", "birth_date");
  set("blood_type", "bloodType", "blood_type");
  set("passport_issue_place", "passportIssuePlace", "passport_issue_place");
  setDate("passport_issue_date", "passportIssueDate", "passport_issue_date");
  set("mahram_name", "mahramName", "mahram_name");
  set("mahram_relation", "mahramRelation", "mahram_relation");
  set("emergency_contact_name", "emergencyContactName", "emergency_contact_name");
  set("emergency_contact_phone", "emergencyContactPhone", "emergency_contact_phone");
  set("health_notes", "healthNotes", "health_notes");
  set("agent_code", "agent", "agentCode", "agent_code");

  // branch_id bertipe uuid dan ber-FK ke branches(id). Form sering mengirim nama
  // cabang, bukan id; bila formatnya bukan uuid, kolom dilewati supaya seluruh
  // update tidak gagal karena "invalid input syntax for type uuid".
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const branch = input.branch ?? input.branchId ?? input.branch_id;
  if (typeof branch === "string" && UUID_RE.test(branch)) {
    out.branch_id = branch;
  } else if (allowClear && (branch === "" || branch === null)) {
    out.branch_id = null;
  }
  return out;
}

type ProfileWriteResult = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at?: string;
};

export async function createJamaah(payload: Partial<JamaahProfile>): Promise<JamaahProfile> {
  const fields = mapProfileFields(payload);
  const email = (fields.email as string) || "";
  const fullName = (fields.full_name as string) || "";
  // Akun auth dibuat di sini dan Supabase Auth mewajibkan email; mengisi alamat
  // palsu hanya akan menciptakan akun login yang tidak bisa dihubungi jamaah.
  if (!fullName) throw new Error("Nama lengkap jamaah wajib diisi.");
  if (!email) throw new Error("Email wajib diisi karena dipakai untuk akun login jamaah.");
  fields.email = email;
  fields.full_name = fullName;
  fields.role = "jamaah";
  // Akun auth selalu dibuat (profiles.id ber-FK ke auth.users), tetapi bisa
  // disimpan nonaktif bila form tidak mencentang "Aktifkan akun login".
  fields.is_active = payload.is_active !== false;

  // profiles.id punya FK ke auth.users, jadi daftarkan user auth nyata lewat
  // /api/users (sudah memakai service-role) sebelum menulis profil, hindari FK 23503.
  let id = payload.id;
  if (!id) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: crypto.randomUUID(),
        full_name: fullName,
        role: "jamaah",
        branch_id: fields.branch_id ?? null,
        phone: fields.phone ?? null,
        is_active: fields.is_active !== false,
      }),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal membuat akun jamaah");
    }
    id = json.data.id as string;
  }

  const data = await dbUpsert<ProfileWriteResult>("profiles", { ...fields, id }, { id });

  return {
    id: data.id ?? id,
    code: `PLG-${(data.id ?? id).slice(0, 8).toUpperCase()}`,
    name: data.full_name || fullName,
    gender: (fields.gender as JamaahProfile["gender"]) || null,
    nik: (fields.nik as string) || "-",
    phone: data.phone || "-",
    passportNumber: (fields.passport_number as string) || "-",
    passportExpiry: (fields.passport_expiry as string) || "-",
    // Nilai ini untuk tampilan saja; label cabang/agen yang sebenarnya diambil
    // dari daftar saat halaman membaca ulang data.
    branch: "-",
    agent: (fields.agent_code as string) || "-",
    status: (fields.status as string) || "Belum Bayar",
    email: data.email || email,
    created_at: data.created_at,
  };
}

export async function updateJamaah(id: string, payload: Partial<JamaahProfile>): Promise<boolean> {
  const fields = mapProfileFields(payload, true);
  await dbUpdate<ProfileWriteResult>("profiles", id, fields);
  return true;
}

export async function deleteJamaah(id: string): Promise<boolean> {
  return dbDelete("profiles", id);
}
