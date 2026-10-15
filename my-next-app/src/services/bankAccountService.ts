import { createClient } from "@/lib/supabase/client";

export interface BankAccountRecord {
  id: string;
  bank_name: string;
  branch_name?: string | null;
  account_number: string;
  account_holder: string;
  office_branch?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getBankAccounts(): Promise<BankAccountRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching bank accounts from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createBankAccount(payload: Partial<BankAccountRecord>): Promise<BankAccountRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating bank account:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateBankAccount(id: string, payload: Partial<BankAccountRecord>): Promise<BankAccountRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating bank account:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBankAccount(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting bank account:", error.message);
    throw new Error(error.message);
  }

  return true;
}
