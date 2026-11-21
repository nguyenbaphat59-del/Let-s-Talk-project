import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
function check(label, condition, detail = '') {
  checks.push({ label, condition: Boolean(condition), detail });
}

const requiredDocs = [
  'docs/LETS_TALK_PRD.md',
  'docs/Solution_Architecture.md',
  'STEP2_COMPLETED.md',
  'docs/03_Database_Schema.md',
  'docs/04_API_Documentation.md',
  'docs/05_Session_Management.md',
  'docs/06_Gameplay_Logic.md',
  'docs/07_Implementation_Roadmap.md',
  'docs/08_Traceability_and_Test_Plan.md',
  'docs/00_STEP2_REVIEW_AND_DECISIONS.md',
  'docs/DESIGN-SYSTEM.md',
  'docs/openapi.yaml',
  'database/validation/security_check.sql'
];
for (const file of requiredDocs) check(`Step 2 artifact: ${file}`, fs.existsSync(path.join(root, file)));

const schema = read('database/schema.sql');
const tableNames = [
  'topics', 'gameplay_modes', 'content_groups',
  'content_group_allowed_types', 'content_items'
];
for (const table of tableNames) {
  check(`Schema creates public.${table}`, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i').test(schema));
  check(`RLS enabled on public.${table}`, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i').test(schema));
}
check('Schema creates exactly five core tables', (schema.match(/CREATE TABLE IF NOT EXISTS public\./gi) || []).length === 5);
check('Runtime anon receives SELECT grant', /GRANT SELECT ON TABLE[\s\S]*?TO anon;/i.test(schema));
check('Schema revokes anon write privileges', /REVOKE ALL ON TABLE[\s\S]*?FROM PUBLIC, anon, authenticated;/i.test(schema));
check('Schema defines one active SELECT policy per core table', tableNames.every((table) => new RegExp(`CREATE POLICY [a-z_]+\\s+ON public\\.${table}[\\s\\S]*?FOR SELECT\\s+TO anon`, 'i').test(schema)));

const sql = read('database/seeds/002_production_content.sql');
const rowPattern = /\('([0-9a-f-]{36})'::uuid,\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'((?:''|[^'])*)',\s*'([^']+)'\)/g;
const rows = [...sql.matchAll(rowPattern)].map((m) => ({
  id: m[1], topic: m[2], group: m[3], type: m[4], text: m[5].replace(/''/g, "'"), sourceId: m[6]
}));
check('Production seed has exactly 880 rows', rows.length === 880, `found ${rows.length}`);
check('Production seed UUIDs are unique', new Set(rows.map((r) => r.id)).size === rows.length);
check('Production source IDs are unique', new Set(rows.map((r) => r.sourceId)).size === rows.length);
check('Production rows have valid UUIDs', rows.every((r) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id)));
check('Production rows contain nonblank text', rows.every((r) => r.text.trim().length > 0));
check('Production topics are only Friends and Family', rows.every((r) => ['friends', 'family'].includes(r.topic)));
check('Production types are question/challenge only', rows.every((r) => ['question', 'challenge'].includes(r.type)));

const groupBy = (items, keyOf) => items.reduce((groups, item) => {
  const key = keyOf(item);
  (groups[key] ||= []).push(item);
  return groups;
}, Object.create(null));
const topicCounts = groupBy(rows, (r) => r.topic);
check('Friends has 440 items', (topicCounts.friends || []).length === 440);
check('Family has 440 items', (topicCounts.family || []).length === 440);
check('Questions total 640', rows.filter((r) => r.type === 'question').length === 640);
check('Challenges total 240', rows.filter((r) => r.type === 'challenge').length === 240);

const expected = {
  'friends|question_zone|question': 100,
  'friends|truth|question': 50,
  'friends|challenge|challenge': 50,
  'friends|double_challenge|challenge': 50,
  'friends|everyone_answers|question': 50,
  'friends|surprise_question|question': 50,
  'friends|pick_a_player|question': 20,
  'friends|pick_a_player|challenge': 20,
  'friends|hot_seat|question': 50,
  'family|question_zone|question': 100,
  'family|truth|question': 50,
  'family|challenge|challenge': 50,
  'family|double_challenge|challenge': 50,
  'family|everyone_answers|question': 50,
  'family|surprise_question|question': 50,
  'family|pick_a_player|question': 20,
  'family|pick_a_player|challenge': 20,
  'family|hot_seat|question': 50
};
const actual = groupBy(rows, (r) => `${r.topic}|${r.group}|${r.type}`);
check('Production seed contains exactly the 18 approved group/type combinations', Object.keys(actual).length === 18);
for (const [key, count] of Object.entries(expected)) {
  check(`Inventory ${key} = ${count}`, (actual[key] || []).length === count, `found ${(actual[key] || []).length}`);
}

const normalize = (value) => value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
const normalizedTexts = rows.map((r) => normalize(r.text));
check('No normalized duplicate prompt text', new Set(normalizedTexts).size === normalizedTexts.length, `${normalizedTexts.length - new Set(normalizedTexts).size} duplicate(s)`);

const openApi = read('docs/openapi.yaml');
check('OpenAPI contract uses version 3.1.0', openApi.includes('openapi: 3.1.0'));
check('OpenAPI contains six documented paths', (openApi.match(/^  \//gm) || []).length === 6);

const apiDocs = read('docs/04_API_Documentation.md');
for (const route of [
  'GET /api/v1/health',
  'GET /api/v1/topics',
  'GET /api/v1/topics/:topicCode/catalog',
  'POST /api/v1/gameplay/next-activity',
  'POST /api/v1/gameplay/resolve-fate',
  'POST /api/v1/gameplay/question-zone/next'
]) check(`API contract contains ${route}`, apiDocs.includes(route));

let failed = false;
for (const item of checks) {
  console.log(`${item.condition ? 'PASS' : 'FAIL'} ${item.label}${item.detail ? ` (${item.detail})` : ''}`);
  if (!item.condition) failed = true;
}
console.log(`\nStep 2 checks: ${checks.filter((c) => c.condition).length}/${checks.length} passed.`);
if (failed) process.exitCode = 1;
