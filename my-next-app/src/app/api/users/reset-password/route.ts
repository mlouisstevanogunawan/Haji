import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, getClientIp } from "@/lib/utils/activity-logger";
import { requireStaffSession, unauthorizedResponse } from "@/lib/api/session";

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "Umroh#";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(req: NextRequest) {
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { userId, email, manualPassword } = body;
    const ip = getClientIp(req);

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: "User ID atau Email wajib diisi" },
        { status: 400 }
      );
    }

    const newPassword = manualPassword || generateSecurePassword();
    const supabase = createAdminClient();

    let resetSuccess = false;
    let errorMsg = "";

    if (userId) {
      try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: newPassword,
        });
        if (error) {
          errorMsg = error.message;
        } else {
          resetSuccess = true;
        }
      } catch (err: any) {
        errorMsg = err.message;
      }
    }

    // Tanpa resetSuccess, kata sandi di auth.users tidak berubah sama sekali —
    // melaporkan keberhasilan hanya akan menipu pengguna.
    if (!resetSuccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            errorMsg ||
            "Gagal mereset kata sandi: pengguna auth tidak ditemukan atau service role ditolak.",
        },
        { status: 500 }
      );
    }

    await logActivity(
      userId || null,
      "reset_password",
      `Kata sandi untuk pengguna ${email || userId} berhasil direset oleh Administrator.`,
      ip,
      { email, method: "admin_reset" }
    );

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil direset",
      temporaryPassword: newPassword,
      notice: resetSuccess ? undefined : errorMsg,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mereset kata sandi" },
      { status: 500 }
    );
  }
}
