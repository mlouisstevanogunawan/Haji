import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";

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
  return dbInsert<BankAccountRecord>("bank_accounts", { ...payload });
}

export async function updateBankAccount(id: string, payload: Partial<BankAccountRecord>): Promise<BankAccountRecord> {
  return dbUpdate<BankAccountRecord>("bank_accounts", id, { ...payload });
}

export async function deleteBankAccount(id: string): Promise<boolean> {
  return dbDelete("bank_accounts", id);
}
