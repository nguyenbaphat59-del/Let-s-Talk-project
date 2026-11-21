import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const check = (label, condition) => checks.push({ label, ok: Boolean(condition) });
const required = [
  'backend/package.json',
  'backend/server.js',
  'backend/src/app.js',
  'backend/src/config/env.js',
  'backend/src/config/supabase.js',
  'backend/src/repositories/supabase-content.repository.js',
  'backend/src/services/content-catalog.service.js',
  'backend/src/services/gameplay.service.js',
  'backend/src/routes/api.routes.js',
  'backend/test/gameplay.service.test.js',
  'backend/test/api.integration.test.js',
  'backend/scripts/check-supabase.js'
];
for (const file of required) check(`Backend artifact exists: ${file}`, fs.existsSync(path.join(root, file)));

const backendPackage = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
check('Backend uses Node 20+', backendPackage.engines?.node === '>=20');
check('Backend depends on Express 5', String(backendPackage.dependencies?.express || '').startsWith('^5.'));
check('Backend includes Supabase JS client', Boolean(backendPackage.dependencies?.['@supabase/supabase-js']));
check('Backend does not depend on service-role/secret key', !Object.keys(backendPackage.dependencies || {}).some((name) => /service.role|secret.key/i.test(name)));

const apiClient = fs.readFileSync(path.join(root, 'frontend/js/api.js'), 'utf8');
check('Frontend API calls use an HTTPS production API base (Render Backend)', /const PRODUCTION_API_BASE =\s*'https:\/\/[^']+\/api\/v1'/.test(apiClient) && apiClient.includes('let defaultBase = PRODUCTION_API_BASE'));
check('Frontend does not contain a Supabase SDK import', !/from\s+['"]@supabase\/supabase-js/.test(apiClient));

const backendSource = fs.readdirSync(path.join(root, 'backend'), { recursive: true })
  .filter((name) => /\.(js|mjs)$/.test(name))
  .map((name) => fs.readFileSync(path.join(root, 'backend', name), 'utf8'))
  .join('\n');
check('Backend runtime config uses the publishable key', backendSource.includes('SUPABASE_PUBLISHABLE_KEY'));
check('Backend does not include write operations', !/\.from\([^)]*\)\.(insert|update|upsert|delete)\s*\(/i.test(backendSource));
check('Backend enforces 128 KB JSON limit', backendSource.includes('limit: "128kb"'));
check('Backend uses rate limiting', backendSource.includes('express-rate-limit'));
check('Backend generates request IDs', backendSource.includes('randomUUID'));
check('Backend includes Hot Seat as an automatic main family', backendSource.includes('candidateFamilies.push(\"hot_seat\")') && backendSource.includes('trigger !== \"automatic\"'));
check('Backend validates allowed group/type reference mappings', backendSource.includes('listAllowedContentTypes') && backendSource.includes('pick_a_player:challenge'));
check('Backend includes a read-only live Supabase inventory check', backendSource.includes('SUPABASE_PUBLISHABLE_KEY') && backendSource.includes('880'));
check('Backend contains all nine independent pool definitions', (backendSource.match(/question_zone|truth|challenge|double_challenge|everyone_answers|surprise_question|pick_a_player_question|pick_a_player_challenge|hot_seat/g) || []).length >= 18);

let failed = false;
for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.label}`);
  if (!item.ok) failed = true;
}
console.log(`\nBackend static checks: ${checks.filter((item) => item.ok).length}/${checks.length} passed.`);
if (failed) process.exitCode = 1;
