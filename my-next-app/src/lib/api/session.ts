import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSessionUser, type SessionUser } from "@/lib/auth/user";
import { isStaffRole } from "@/lib/auth/roles";

/**
 * Verifikasi sesi untuk Route Handler.
 *
 * Endpoint API berjalan dengan service-role (bypass RLS), jadi pemanggilnya
 * harus terbukti punya sesi Supabase Auth. Token divalidasi ke server auth
 * (atau bearer token yang dikirim), bukan dari cookie bebas yang bisa ditulis
 * manual seperti login demo sebelumnya.
 */
export async function requireSession(req: NextRequest): Promise<SessionUser | null> {
  const supabase = createClient();
  const bearer = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  const {
    data: { user },
  } = await supabase.auth.getUser(bearer || undefined);

  if (!user) return null;
  return buildSessionUser(supabase, user);
}

/** Untuk endpoint yang hanya boleh dipakai Super Admin / Admin Cabang. */
export async function requireStaffSession(
  req: NextRequest
): Promise<SessionUser | null> {
  const session = await requireSession(req);
  if (!session) return null;
  return isStaffRole(session.role) ? session : null;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Sesi tidak valid atau akun tidak punya hak akses untuk data ini.",
    },
    { status: 401 }
  );
}
