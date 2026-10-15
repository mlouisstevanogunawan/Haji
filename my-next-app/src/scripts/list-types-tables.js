const fs = require('fs');
const content = fs.readFileSync('src/types/supabase.types.ts', 'utf-8');
const tablesMatch = content.match(/Tables:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*Views:/);
if (tablesMatch) {
  const tableBlock = tablesMatch[1];
  const tableNames = [...tableBlock.matchAll(/^\s{6}([a-z_]+):\s*\{/gm)].map(m => m[1]);
  console.log('Tables defined in supabase.types.ts:', tableNames);
} else {
  console.log('Could not match Tables block');
}
