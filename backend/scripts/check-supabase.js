import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { readBackendEnv } from '../src/config/env.js';
import { createSupabaseClient } from '../src/config/supabase.js';
import { SupabaseContentRepository } from '../src/repositories/supabase-content.repository.js';
import { ContentCatalogService } from '../src/services/content-catalog.service.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

const EXPECTED = Object.freeze({
  question_zone: 100,
  truth: 50,
  challenge: 50,
  double_challenge: 50,
  everyone_answers: 50,
  surprise_question: 50,
  pick_a_player_question: 20,
  pick_a_player_challenge: 20,
  hot_seat: 50
});

async function main() {
  const env = readBackendEnv();
  const client = createSupabaseClient(env);
  const repository = new SupabaseContentRepository(client);
  const catalogService = new ContentCatalogService(repository);
  const topics = await catalogService.listTopics();
  const topicCodes = topics.map((topic) => topic.code).sort();
  if (JSON.stringify(topicCodes) !== JSON.stringify(['family', 'friends'])) {
    throw new Error(`Expected active topics Friends and Family; received: ${topicCodes.join(', ') || '(none)'}.`);
  }

  let grandTotal = 0;
  for (const topicCode of ['friends', 'family']) {
    const catalog = await catalogService.getCatalog(topicCode);
    const mismatches = [];
    let total = 0;
    for (const [poolCode, expected] of Object.entries(EXPECTED)) {
      const actual = catalog.pools[poolCode]?.available;
      total += Number(actual) || 0;
      if (actual !== expected) mismatches.push(`${poolCode}: expected ${expected}, got ${actual}`);
    }
    if (total !== 440) mismatches.push(`total: expected 440, got ${total}`);
    if (mismatches.length) {
      throw new Error(`${topicCode} inventory check failed:\n- ${mismatches.join('\n- ')}`);
    }
    grandTotal += total;
    console.log(`PASS ${topicCode}: 9 pools, ${total} active content items`);
  }

  if (grandTotal !== 880) throw new Error(`Expected 880 active content items, got ${grandTotal}.`);
  console.log('PASS Supabase read-only connectivity and LET\'S TALK content inventory: 880/880');
}

main().catch((error) => {
  console.error('Supabase check failed:', error.message);
  process.exitCode = 1;
});
