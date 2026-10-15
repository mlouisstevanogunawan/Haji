import { createClient } from "@/lib/supabase/client";

export interface ManasikSessionRecord {
  id: string;
  title: string;
  package_id?: string | null;
  package_name?: string | null;
  session_date: string;
  session_time: string;
  location: string;
  muthawif_id?: string | null;
  muthawif_name?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ManasikAttendanceRecord {
  id: string;
  session_id: string;
  pilgrim_id?: string | null;
  pilgrim_name: string;
  nik?: string | null;
  status: "Hadir" | "Izin" | "Sakit" | "Alpa";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getManasikSessions(): Promise<ManasikSessionRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manasik_sessions")
    .select("*")
    .order("session_date", { ascending: true });

  if (error) {
    console.error("Error fetching manasik sessions:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getAttendanceBySession(sessionId: string): Promise<ManasikAttendanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manasik_attendance")
    .select("*")
    .eq("session_id", sessionId)
    .order("pilgrim_name", { ascending: true });

  if (error) {
    console.error("Error fetching manasik attendance:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createManasikSession(payload: Partial<ManasikSessionRecord>): Promise<ManasikSessionRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manasik_sessions")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating manasik session:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateAttendanceStatus(
  id: string,
  status: "Hadir" | "Izin" | "Sakit" | "Alpa"
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("manasik_attendance")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating attendance:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function deleteManasikSession(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("manasik_sessions").delete().eq("id", id);
  if (error) {
    console.error("Error deleting manasik session:", error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function ensureSessionAttendance(sessionId: string): Promise<ManasikAttendanceRecord[]> {
  const supabase = createClient();
  const existing = await getAttendanceBySession(sessionId);
  if (existing.length > 0) return existing;

  // Otherwise populate from profiles
  const { data: pilgrims } = await supabase
    .from("profiles")
    .select("id, full_name, raw_user_meta_data")
    .in("role", ["jamaah", "jamaah_umroh"]);

  if (!pilgrims || pilgrims.length === 0) return [];

  const inserts = pilgrims.map((p) => {
    const meta = (p.raw_user_meta_data as any) || {};
    return {
      session_id: sessionId,
      pilgrim_id: p.id,
      pilgrim_name: p.full_name || "Jamaah",
      nik: meta.nik || "-",
      status: "Hadir" as const,
    };
  });

  const { data: created, error } = await supabase
    .from("manasik_attendance")
    .insert(inserts)
    .select();

  if (error) {
    console.error("Error populating attendance:", error.message);
    return [];
  }

  return created as ManasikAttendanceRecord[];
}
