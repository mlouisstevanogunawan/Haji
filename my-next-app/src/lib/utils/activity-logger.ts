import { createAdminClient } from "@/lib/supabase/admin";

export interface LogActivityParams {
  userId?: string | null;
  action: string;
  description: string;
  ipAddress?: string | null;
  metadata?: Record<string, any> | null;
}

// Global in-memory log buffer for instantaneous real-time display and demo fallback
const g = globalThis as any;
g.__appActivityLogsBuffer = g.__appActivityLogsBuffer || [];
export const memoryLogsBuffer: Array<{
  id: string;
  user_id: string | null;
  user_name?: string;
  action: string;
  description: string;
  ip_address: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}> = g.__appActivityLogsBuffer;

/**
 * Extract client IP from Request or NextRequest headers
 */
export function getClientIp(req?: Request | { headers: Headers }): string {
  if (!req) return "-";
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // ignore
  }
  return "-";
}

/**
 * Log user/system activity into activity_logs table in Supabase
 */
export async function logActivity(
  userId: string | null | undefined,
  action: string,
  description: string,
  ipAddress: string | null = "-",
  metadata?: Record<string, any> | null,
  userName?: string
) {
  const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  // Push to in-memory audit trail buffer
  memoryLogsBuffer.unshift({
    id: logId,
    user_id: userId || null,
    user_name: userName || (userId ? "Admin / Pengguna" : "Sistem"),
    action,
    description,
    ip_address: ipAddress || "-",
    metadata: metadata || null,
    created_at: now,
  });

  try {
    const supabase = createAdminClient();

    const insertPayload = {
      user_id: userId || null,
      action,
      description,
      ip_address: ipAddress || "-",
      metadata: metadata || null,
      created_at: now,
    };

    const { data, error } = await supabase
      .from("activity_logs")
      .insert(insertPayload)
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn("[activity-logger] Warning inserting log to Supabase:", error.message);
      return { success: true, id: logId, warning: error.message };
    }

    return { success: true, id: data?.id || logId };
  } catch (err: any) {
    console.warn("[activity-logger] Exception while logging activity:", err?.message || err);
    return { success: true, id: logId, warning: err?.message };
  }
}
