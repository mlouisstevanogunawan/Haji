import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export async function getAgents(): Promise<AgentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching agents from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getAgentById(id: string): Promise<AgentRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching agent by id:", error.message);
    return null;
  }

  return data;
}

export async function createAgent(payload: AgentInsert): Promise<AgentRow> {
  return dbInsert<AgentRow>("agents", { ...payload });
}

export async function updateAgent(id: string, payload: AgentUpdate): Promise<AgentRow> {
  return dbUpdate<AgentRow>("agents", id, { ...payload });
}

export async function deleteAgent(id: string): Promise<boolean> {
  return dbDelete("agents", id);
}
