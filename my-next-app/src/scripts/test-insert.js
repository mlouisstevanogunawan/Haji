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

async function testInsert() {
  const { data, error } = await supabase.from('packages').insert([
    {
      name: 'Test Package',
      type: 'umroh',
      price: 25000000,
      duration_days: 9,
      quota: 40,
      facilities: ['Hotel', 'Tiket'],
      description: 'Test description',
      is_active: true
    }
  ]).select();
  if (error) {
    console.log('INSERT error:', error.message, error.code);
  } else {
    console.log('INSERT success:', data);
    // clean up
    await supabase.from('packages').delete().eq('id', data[0].id);
  }
}
testInsert();
