import { createClient } from "@/lib/supabase/client";
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

export async function getCommissions(): Promise<CommissionWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commissions")
    .select(`
      *,
      agents:agent_id (id, name, phone, email, commission_rate),
      bookings:booking_id (
        id, total_price, status, pilgrim_id,
        profiles:pilgrim_id (id, full_name),
        packages:package_id (name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching commissions from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data as unknown as CommissionWithDetails[]) || [];
}

export async function createCommission(payload: CommissionInsert): Promise<CommissionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commissions")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating commission:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateCommission(id: string, payload: CommissionUpdate): Promise<CommissionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commissions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating commission:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteCommission(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("commissions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting commission:", error.message);
    throw new Error(error.message);
  }

  return true;
}
