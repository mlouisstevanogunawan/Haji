import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, getClientIp } from "@/lib/utils/activity-logger";
import { requireStaffSession, unauthorizedResponse } from "@/lib/api/session";

/**
 * Form pengguna mengirim nama cabang, sedangkan profiles menyimpan branch_id.
 * Tanpa resolusi ini pilihan cabang hilang diam-diam saat disimpan.
 */
async function resolveBranchId(
  supabase: ReturnType<typeof createAdminClient>,
  branchId: unknown,
  branchName: unknown
): Promise<string | null> {
  if (typeof branchId === "string" && branchId) return branchId;
  if (typeof branchName !== "string" || !branchName) return null;
  const { data } = await supabase
    .from("branches")
    .select("id")
    .eq("name", branchName)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const role = searchParams.get("role");

    // Fetch branches map
    let branchesMap: Record<string, string> = {};
    try {
      const { data: branches } = await supabase.from("branches").select("id, name");
      if (branches && branches.length > 0) {
        branches.forEach((b: any) => {
          branchesMap[b.id] = b.name;
        });
      }
    } catch {
      // branches table not yet ready
    }

    // last_sign_in_at hanya ada di auth.users, bukan di public.profiles.
    let lastSignInMap: Record<string, string | null> = {};
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      (authUsers?.users || []).forEach((u: any) => {
        lastSignInMap[u.id] = u.last_sign_in_at ?? null;
      });
    } catch {
      // service_role tanpa hak listUsers: kolom login terakhir tetap "-"
    }

    // Fetch profiles from Supabase
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, branch_id, is_active, phone, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    let rawData: any[] = [];
    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    rawData = data || [];

    let usersData = rawData.map((item: any) => ({
      ...item,
      branch_name: item.branch_id ? branchesMap[item.branch_id] || null : null,
      is_active: item.is_active ?? true,
      last_sign_in_at: lastSignInMap[item.id] ?? null,
    }));

    // Filter by search query if provided
    if (search) {
      usersData = usersData.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.toLowerCase().includes(search)
      );
    }

    // Sort alphabetically by full_name ascending
    usersData.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

    return NextResponse.json({
      success: true,
      data: usersData,
      count: usersData.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { email, password, full_name, role, branch_id, branch_name, phone, is_active } = body;
    const ip = getClientIp(req);

    // Validations
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Alamat email tidak valid" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Kata sandi minimal 6 karakter" },
        { status: 400 }
      );
    }
    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap wajib diisi" },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Peran / Hak akses wajib dipilih" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create user in Supabase Auth via admin API
    let authUser: any = null;
    let createError: any = null;

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          phone: phone || null,
          branch_name: branch_name || null,
        },
      });

      if (error) {
        createError = error;
      } else {
        authUser = data.user;
      }
    } catch (authException: any) {
      createError = authException;
    }

    if (createError) {
      const msg = createError.message || "";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists")
      ) {
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar dalam sistem" },
          { status: 400 }
        );
      }
      // profiles.id ber-foreign-key ke auth.users. Tanpa baris auth, INSERT profil
      // akan selalu gagal 23503 — jadi jangan lanjut dengan id karangan sendiri.
      return NextResponse.json(
        {
          success: false,
          error:
            "Gagal membuat akun auth: " +
            (msg || "SUPABASE_SERVICE_ROLE_KEY belum di-set atau tidak valid."),
        },
        { status: 500 }
      );
    }

    const userId = authUser.id;

    // 2. Insert/Update into public.profiles
    const resolvedBranchId = await resolveBranchId(supabase, branch_id, branch_name);
    const profilePayload = {
      id: userId,
      email,
      full_name,
      role,
      branch_id: resolvedBranchId,
      phone: phone || null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload);

    if (profileError) {
      return NextResponse.json(
        { success: false, error: `Akun dibuat tapi profil gagal disimpan: ${profileError.message}` },
        { status: 500 }
      );
    }

    const newUserObj = {
      id: userId,
      email,
      full_name,
      role,
      branch_id: resolvedBranchId,
      branch_name: branch_name || null,
      phone,
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
    };

    // 3. Log activity
    await logActivity(
      userId,
      "create_user",
      `Pengguna baru ${full_name} (${email}) berhasil dibuat dengan peran ${role}.`,
      ip,
      { role, branch_id, branch_name }
    );

    return NextResponse.json({
      success: true,
      message: "Pengguna baru berhasil dibuat",
      data: newUserObj,
    });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { id, full_name, role, branch_id, branch_name, phone, is_active } = body;
    const ip = getClientIp(req);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pengguna diperlukan" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update profiles table
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (role !== undefined) updatePayload.role = role;
    if (branch_id !== undefined || branch_name !== undefined) {
      // Nama cabang dari form diterjemahkan ke branch_id yang sebenarnya.
      const resolved = await resolveBranchId(supabase, branch_id, branch_name);
      if (resolved || (branch_id === null && !branch_name)) {
        updatePayload.branch_id = resolved;
      }
    }
    if (phone !== undefined) updatePayload.phone = phone;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Update Auth metadata if full_name or role changed
    try {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          ...(full_name ? { full_name } : {}),
          ...(role ? { role } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    } catch {
      // ignore if auth user is demo
    }

    // Log Activity
    await logActivity(
      id,
      "update_user",
      `Data profil pengguna ${full_name || id} berhasil diperbarui.`,
      ip,
      { role, is_active }
    );

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui",
      data: { id, ...updatePayload, branch_name },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    const ip = getClientIp(req);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pengguna diperlukan" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (permanent) {
      // Hard delete
      try {
        await supabase.auth.admin.deleteUser(id);
      } catch {
        // auth user mungkin memang tidak ada untuk akun demo
      }
      const { error: deleteError } = await supabase.from("profiles").delete().eq("id", id);
      if (deleteError) {
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      await logActivity(
        id,
        "delete_user",
        `Pengguna ${id} berhasil dihapus permanen dari sistem.`,
        ip
      );
    } else {
      // Soft delete: set is_active to false
      const { error: deactivateError } = await supabase
        .from("profiles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (deactivateError) {
        return NextResponse.json(
          { success: false, error: deactivateError.message },
          { status: 500 }
        );
      }

      await logActivity(
        id,
        "delete_user",
        `Pengguna ${id} dinonaktifkan (status nonaktif).`,
        ip
      );
    }

    return NextResponse.json({
      success: true,
      message: permanent ? "Pengguna berhasil dihapus" : "Pengguna dinonaktifkan",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
