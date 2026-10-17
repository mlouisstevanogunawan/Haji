import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];
export type CommissionInsert = Database["public"]["Tables"]["commissions"]["Insert"];
export type CommissionUpdate = Database["public"]["Tables"]["commissions"]["Update"];
export type CommissionStatus = Database["public"]["Enums"]["commission_status"];

export type CommissionWithDetails = CommissionRow & {
  agents: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    commission_rate: number;
  } | null;
  bookings: {
    id: string;
    total_price: number;
    status: string;
    pilgrim_id: string;
    profiles?: {
      id: string;
      full_name: string | null;
    } | null;
    packages?: {
      name: string;
    } | null;
  } | null;
};

const COMMISSION_SELECT = `
  *,
  agents:agent_id (id, name, phone, email, commission_rate),
  bookings:booking_id (
    id, total_price, status, pilgrim_id,
    profiles:pilgrim_id (id, full_name),
    packages:package_id (name)
  )
`;

export async function getCommissions(): Promise<CommissionWithDetails[]> {
  try {
    const data = await dbRead<CommissionWithDetails>("commissions", {
      select: COMMISSION_SELECT,
      order: "created_at",
      desc: true,
    });
    return data;
  } catch (error: any) {
    console.error("Error fetching commissions from Supabase:", error.message);
    throw error;
  }
}

export async function createCommission(payload: CommissionInsert): Promise<CommissionRow> {
  return dbInsert<CommissionRow>("commissions", { ...payload });
}

export async function updateCommission(id: string, payload: CommissionUpdate): Promise<CommissionRow> {
  return dbUpdate<CommissionRow>("commissions", id, { ...payload });
}

export async function deleteCommission(id: string): Promise<boolean> {
  return dbDelete("commissions", id);
}
