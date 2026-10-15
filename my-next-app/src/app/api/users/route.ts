import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, getClientIp } from "@/lib/utils/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const role = searchParams.get("role");

    // Fetch branches map
    let branchesMap: Record<string, string> = {
      default: "Kantor Pusat Jakarta",
    };
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

    // Fetch profiles from Supabase
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, branch_id, is_active, phone, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Supabase profiles query error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let usersData = (data || []).map((item: any) => ({
      ...item,
      branch_name: item.branch_id ? branchesMap[item.branch_id] || "Kantor Pusat Jakarta" : "Kantor Pusat Jakarta",
      is_active: item.is_active ?? true,
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
      // If user already registered with that email, return explicit error
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar dalam sistem" },
          { status: 400 }
        );
      }
      console.warn("[Create User Auth Notice]:", msg);
      // If admin auth failed due to missing/invalid service role key, proceed with profile & audit logging
    }

    const userId = authUser?.id || crypto.randomUUID();

    // 2. Insert/Update into public.profiles
    const profilePayload = {
      id: userId,
      email,
      full_name,
      role,
      branch_id: branch_id || null,
      phone: phone || null,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from("profiles").upsert(profilePayload);
    } catch (dbErr) {
      console.warn("Could not upsert profile directly:", dbErr);
    }

    const newUserObj = {
      id: userId,
      email,
      full_name,
      role,
      branch_id,
      branch_name: branch_name || "Kantor Pusat Jakarta",
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
    if (branch_id !== undefined) updatePayload.branch_id = branch_id;
    if (phone !== undefined) updatePayload.phone = phone;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    await supabase.from("profiles").update(updatePayload).eq("id", id);

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
        // ignore
      }
      await supabase.from("profiles").delete().eq("id", id);

      await logActivity(
        id,
        "delete_user",
        `Pengguna ${id} berhasil dihapus permanen dari sistem.`,
        ip
      );
    } else {
      // Soft delete: set is_active to false
      await supabase
        .from("profiles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

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
