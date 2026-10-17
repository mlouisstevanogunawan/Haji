import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, getClientIp, memoryLogsBuffer } from "@/lib/utils/activity-logger";
import { requireSession, requireStaffSession, unauthorizedResponse } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  // Daftar log aktivitas berisi data pribadi jamaah: hanya staf yang boleh membaca.
  if (!(await requireStaffSession(req))) return unauthorizedResponse();
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const action = searchParams.get("action");
    const user = searchParams.get("user");

    let logs: any[] = [];

    let query = supabase
      .from("activity_logs")
      .select(`
        id,
        user_id,
        action,
        description,
        ip_address,
        metadata,
        created_at,
        profiles (
          id,
          full_name,
          email,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (action && action !== "all") {
      query = query.eq("action", action);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("activity_logs table query:", error.message);
    } else if (data) {
      logs = data.map((item: any) => {
        const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        return {
          id: item.id,
          user_id: item.user_id,
          user_name: profile?.full_name || (item.user_id ? "Pengguna" : "Sistem"),
          action: item.action,
          description: item.description,
          ip_address: item.ip_address || "-",
          metadata: item.metadata,
          created_at: item.created_at,
          user: profile || null,
        };
      });
    }

    // Filter by search query
    if (search) {
      logs = logs.filter(
        (l) =>
          l.description?.toLowerCase().includes(search) ||
          l.action?.toLowerCase().includes(search) ||
          l.user_name?.toLowerCase().includes(search) ||
          l.ip_address?.toLowerCase().includes(search)
      );
    }

    // Filter by action
    if (action && action !== "all") {
      logs = logs.filter((l) => l.action === action);
    }

    // Filter by user
    if (user && user !== "all") {
      logs = logs.filter(
        (l) =>
          l.user_id === user ||
          l.user_name?.toLowerCase() === user.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSession(req))) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { userId, action, description, metadata } = body;
    const ip = getClientIp(req);

    if (!action || !description) {
      return NextResponse.json(
        { success: false, error: "Action and description are required" },
        { status: 400 }
      );
    }

    const res = await logActivity(userId, action, description, ip, metadata);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log activity" },
      { status: 500 }
    );
  }
}
