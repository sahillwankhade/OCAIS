import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = '.next/static';
const patterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=/,
  /HMAC_SECRET_KEY\s*=/,
  /MSG91_AUTH_KEY\s*=/,
  /RAZORPAY_KEY_SECRET\s*=/,
  /SUPERADMIN_PIN\s*=/,
];
const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);
const findings = [];
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of patterns) if (pattern.test(content)) findings.push(`${file}: ${pattern}`);
}
if (findings.length) {
  console.error('Server-only secret names found in client bundle:', findings.join('\n'));
  process.exit(1);
}
console.log(`Client bundle secret scan passed (${files.length} files checked).`);
