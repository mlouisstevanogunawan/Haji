import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";

export interface BranchRecord {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_headquarter: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getBranches(): Promise<BranchRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("is_headquarter", { ascending: false });

  if (error) {
    console.error("Error fetching branches from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createBranch(payload: Partial<BranchRecord>): Promise<BranchRecord> {
  return dbInsert<BranchRecord>("branches", { ...payload });
}

export async function updateBranch(id: string, payload: Partial<BranchRecord>): Promise<BranchRecord> {
  return dbUpdate<BranchRecord>("branches", id, { ...payload });
}

export async function deleteBranch(id: string): Promise<boolean> {
  return dbDelete("branches", id);
}
