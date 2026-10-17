import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/session";

/**
 * Identitas sesi aktif (id, email, nama, role, homePath) untuk form login dan
 * komponen client. Peran dibaca dari tabel profiles, bukan dari tebakan email.
 */
export async function GET(req: NextRequest) {
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json(
      { success: false, user: null, error: "Tidak ada sesi login yang valid." },
      { status: 401 }
    );
  }
  return NextResponse.json({ success: true, user: session });
}
