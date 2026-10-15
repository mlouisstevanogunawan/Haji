const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.resolve(".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) env[k.trim()] = v.join("=").trim();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = ['packages', 'hotels', 'flights', 'announcements', 'equipment', 'agents', 'guides', 'invoices', 'payments', 'bookings'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) {
      console.log(`[${t}] SELECT ERROR:`, error.message);
    } else {
      console.log(`[${t}] Count: ${data.length}`, data.slice(0, 1));
    }
  }
}
inspect();
