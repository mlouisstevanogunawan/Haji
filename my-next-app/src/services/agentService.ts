import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating agent:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateAgent(id: string, payload: AgentUpdate): Promise<AgentRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("agents")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating agent:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAgent(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("agents").delete().eq("id", id);

  if (error) {
    console.error("Error deleting agent:", error.message);
    throw new Error(error.message);
  }

  return true;
}
