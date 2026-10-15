import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating branch:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateBranch(id: string, payload: Partial<BranchRecord>): Promise<BranchRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating branch:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBranch(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("branches").delete().eq("id", id);

  if (error) {
    console.error("Error deleting branch:", error.message);
    throw new Error(error.message);
  }

  return true;
}
