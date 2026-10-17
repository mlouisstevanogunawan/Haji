import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";

export interface ManasikSessionRecord {
  id: string;
  title: string;
  package_id?: string | null;
  package_name?: string | null;
  session_date: string;
  session_time?: string | null;
  location?: string | null;
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
  return dbRead<ManasikSessionRecord>("manasik_sessions", {
    select: "*",
    order: "session_date",
  });
}

export async function getManasikSessionById(id: string): Promise<ManasikSessionRecord | null> {
  const rows = await dbRead<ManasikSessionRecord>("manasik_sessions", {
    select: "*",
    eq: { id },
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function getAttendanceBySession(sessionId: string): Promise<ManasikAttendanceRecord[]> {
  return dbRead<ManasikAttendanceRecord>("manasik_attendance", {
    select: "*",
    eq: { session_id: sessionId },
    order: "pilgrim_name",
  });
}

export async function createManasikSession(payload: Partial<ManasikSessionRecord>): Promise<ManasikSessionRecord> {
  return dbInsert<ManasikSessionRecord>("manasik_sessions", { ...payload });
}

export async function updateManasikSession(
  id: string,
  payload: Partial<ManasikSessionRecord>
): Promise<ManasikSessionRecord> {
  return dbUpdate<ManasikSessionRecord>("manasik_sessions", id, { ...payload });
}

export async function updateAttendanceStatus(
  id: string,
  status: "Hadir" | "Izin" | "Sakit" | "Alpa"
): Promise<boolean> {
  await dbUpdate<ManasikAttendanceRecord>("manasik_attendance", id, { status });
  return true;
}

export async function deleteManasikSession(id: string): Promise<boolean> {
  return dbDelete("manasik_sessions", id);
}

export async function ensureSessionAttendance(sessionId: string): Promise<ManasikAttendanceRecord[]> {
  const existing = await getAttendanceBySession(sessionId);
  if (existing.length > 0) return existing;

  // Populate dari kolom `profiles` yang nyata (nik, full_name). raw_user_meta_data
  // bukan kolom profiles sehingga selalu undefined dan membuat NIK "-" terus.
  const pilgrims = await dbRead<{ id: string; full_name: string | null; nik: string | null }>(
    "profiles",
    { select: "id, full_name, nik", in: { role: ["jamaah", "jamaah_umroh"] } }
  );

  if (pilgrims.length === 0) return [];

  const inserts = pilgrims.map((p) => ({
    session_id: sessionId,
    pilgrim_id: p.id,
    pilgrim_name: p.full_name || "Jamaah",
    nik: p.nik || "-",
    status: "Hadir" as const,
  }));

  try {
    // /api/db menulis satu baris per permintaan, jadi populate dilakukan per record.
    return await Promise.all(
      inserts.map((row) => dbInsert<ManasikAttendanceRecord>("manasik_attendance", row))
    );
  } catch (error) {
    console.error("Error populating attendance:", (error as Error).message);
    return [];
  }
}
