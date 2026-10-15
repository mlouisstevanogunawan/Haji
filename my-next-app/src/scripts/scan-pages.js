const fs = require('fs');
const path = require('path');

const dir = path.resolve('src/app/(dashboard)');
function scanDir(current) {
  const items = fs.readdirSync(current, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(current, item.name);
    if (item.isDirectory()) {
      scanDir(full);
    } else if (item.name === 'page.tsx') {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      const rel = path.relative(dir, full).replace(/\\/g, '/');
      if (lines.length <= 5 && content.includes('export { default }')) {
        console.log(`[RE-EXPORT] ${rel} -> ${content.trim()}`);
      } else {
        const hasLocalStorage = content.includes('localStorage');
        const hasSupabase = content.includes('supabase') || content.includes('createClient');
        const hasArrayHardcode = content.includes('const initial') || content.includes('const mock') || content.includes('const dummy');
        console.log(`[PAGE] ${rel} (${lines.length} lines) - localStorage: ${hasLocalStorage}, supabase: ${hasSupabase}, mockConst: ${hasArrayHardcode}`);
      }
    }
  }
}
scanDir(dir);
