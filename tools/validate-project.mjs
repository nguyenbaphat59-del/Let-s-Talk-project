import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = path.join(root, 'frontend');
const required = [
  'frontend/index.html','frontend/about.html','frontend/how-to-play.html',
  'frontend/gameplay.html','frontend/game-complete.html',
  'frontend/css/site.css','frontend/css/gameplay.css',
  'frontend/js/storage.js','frontend/js/api.js','frontend/js/session.js',
  'frontend/js/homepage.js','frontend/js/gameplay.js','frontend/js/game-complete.js',
  'frontend/data/questions.json','frontend/data/activities.json',
  'frontend/assets/images/favicon.png','frontend/assets/images/lets-talk-logo.png',
  'frontend/assets/images/shared-background.webp','frontend/assets/images/about-background.webp',
  'backend/server.js','backend/src/app.js','backend/src/services/gameplay.service.js',
  'docs/openapi.yaml','database/schema.sql'
];

let failed = false;
for (const file of required) {
  const ok = fs.existsSync(path.join(root, file));
  console.log(`${ok ? 'PASS' : 'FAIL'} required file: ${file}`);
  if (!ok) failed = true;
}

const bank = JSON.parse(fs.readFileSync(path.join(frontend, 'data/questions.json'), 'utf8'));
for (const topic of ['friends', 'family']) {
  const questions = bank[topic];
  const ids = new Set((questions || []).map((question) => question.id));
  const ok = Array.isArray(questions) && questions.length === 100 &&
    ids.size === questions.length &&
    questions.every((question) => question.topic === topic && question.content?.trim());
  console.log(`${ok ? 'PASS' : 'FAIL'} prototype ${topic}: ${questions?.length ?? 0} questions, ${ids.size} unique IDs`);
  if (!ok) failed = true;
}

const activityBank = JSON.parse(fs.readFileSync(path.join(frontend, 'data/activities.json'), 'utf8'));
for (const key of ['challenges', 'events']) {
  const items = activityBank[key];
  const ok = Array.isArray(items) && items.length > 0 &&
    items.every((item) => item.id && (item.content || item.title));
  console.log(`${ok ? 'PASS' : 'FAIL'} prototype activity bank ${key}: ${items?.length ?? 0} items`);
  if (!ok) failed = true;
}

for (const htmlFile of ['index.html','about.html','how-to-play.html','gameplay.html','game-complete.html']) {
  const html = fs.readFileSync(path.join(frontend, htmlFile), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const missing = refs.filter((ref) =>
    !/^(https?:|mailto:|tel:|#|data:)/i.test(ref) &&
    !fs.existsSync(path.resolve(frontend, ref.split('#')[0]))
  );
  const ok = missing.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} local references in frontend/${htmlFile}${missing.length ? `: ${missing.join(', ')}` : ''}`);
  if (!ok) failed = true;
}

for (const file of ['index.html','gameplay.html','game-complete.html']) {
  const html = fs.readFileSync(path.join(frontend, file), 'utf8');
  const apiIndex = html.indexOf('js/api.js');
  const sessionIndex = html.indexOf('js/session.js');
  const storageIndex = html.indexOf('js/storage.js');
  const ok = storageIndex >= 0 && apiIndex > storageIndex && sessionIndex > apiIndex;
  console.log(`${ok ? 'PASS' : 'FAIL'} script dependency order in frontend/${file}`);
  if (!ok) failed = true;
}

const integratedScripts = ['homepage.js','gameplay.js','session.js','game-complete.js'];
for (const file of integratedScripts) {
  const source = fs.readFileSync(path.join(frontend, 'js', file), 'utf8');
  const readsPrototypeJson = /fetch\s*\(\s*['"`]data\/(?:questions|activities)\.json/i.test(source);
  const ok = !readsPrototypeJson;
  console.log(`${ok ? 'PASS' : 'FAIL'} frontend/js/${file} does not load prototype JSON at runtime`);
  if (!ok) failed = true;
}


const gameplayHtml = fs.readFileSync(path.join(frontend, 'gameplay.html'), 'utf8');
const hasManualHotSeat = gameplayHtml.includes('id="manual-hotseat-btn"');
const rouletteEntries = [...gameplayHtml.matchAll(/class="roulette-item"/g)];
const hasHotSeatRoulette = /data-roulette="hot_seat"/i.test(gameplayHtml);
const hasFourAutomaticFamilies = ['question_zone', 'pick_your_fate', 'random_event', 'hot_seat']
  .every((family) => gameplayHtml.includes(`data-roulette="${family}"`));
for (const [label, ok] of [
  ['Gameplay has no separate manual Hot Seat control', !hasManualHotSeat],
  ['Automatic roulette has exactly four families', rouletteEntries.length === 4],
  ['Hot Seat is included in automatic roulette', hasHotSeatRoulette && hasFourAutomaticFamilies]
]) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed = true;
}

const sessionSource = fs.readFileSync(path.join(frontend, 'js', 'session.js'), 'utf8');
const documentedKeys = sessionSource.includes('letsTalk.activeSession.v2') &&
  sessionSource.includes('letsTalk.setupConfig.v1') &&
  sessionSource.includes('letsTalk.lastResult.v1');
console.log(`${documentedKeys ? 'PASS' : 'FAIL'} Session uses the documented Local Storage schema keys`);
if (!documentedKeys) failed = true;

if (failed) process.exitCode = 1;
else console.log('\nProject structure, local references, and prototype-reference validation passed.');
