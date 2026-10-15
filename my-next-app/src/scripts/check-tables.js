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

async function check() {
  const tables = [
    'profiles', 'branches', 'packages', 'hotels', 'flights',
    'bookings', 'documents', 'equipment', 'agents', 'guides',
    'announcements', 'commissions', 'invoices', 'payments',
    'activity_logs', 'pilgrims', 'students', 'tasks'
  ];
  for (const t of tables) {
    try {
      const { data, error, count } = await supabase.from(t).select('*', { count: 'exact' });
      if (error) {
        console.log(`[${t}] ERROR: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`[${t}] OK: ${count} rows (first row sample: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'empty'})`);
      }
    } catch (e) {
      console.log(`[${t}] EXCEPTION: ${e.message}`);
    }
  }
}
check();
