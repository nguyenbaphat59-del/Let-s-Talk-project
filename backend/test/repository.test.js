import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseContentRepository } from '../src/repositories/supabase-content.repository.js';

function createSupabaseMock(resultByTable = {}) {
  const calls = [];
  const supabase = {
    from(table) {
      const query = { table, calls: [] };
      calls.push(query);
      const chain = (method) => (...args) => {
        query.calls.push([method, ...args]);
        return chainObject;
      };
      const chainObject = {
        select: chain('select'),
        eq: chain('eq'),
        in: chain('in'),
        order: chain('order'),
        maybeSingle: chain('maybeSingle'),
        then(resolve, reject) {
          return Promise.resolve(resultByTable[table] || { data: [] }).then(resolve, reject);
        }
      };
      return chainObject;
    }
  };
  return { supabase, calls };
}

test('repository reads only the five approved catalog tables and filters active rows', async () => {
  const { supabase, calls } = createSupabaseMock({
    topics: { data: [{ code: 'friends' }] },
    content_groups: { data: [{ code: 'question_zone' }] },
    content_group_allowed_types: { data: [{ content_type: 'question' }] },
    content_items: { data: [{ content_text: 'A question' }] }
  });
  const repository = new SupabaseContentRepository(supabase);
  await repository.listActiveTopics();
  await repository.findActiveTopic('friends');
  await repository.listActiveGroups('topic-id');
  await repository.listAllowedContentTypes(['group-id']);
  await repository.listActiveContentItems(['group-id']);

  assert.deepEqual(calls.map((call) => call.table), [
    'topics', 'topics', 'content_groups', 'content_group_allowed_types', 'content_items'
  ]);
  for (const table of ['topics', 'content_groups', 'content_items']) {
    const query = calls.find((entry) => entry.table === table);
    assert.ok(query.calls.some(([method, column, value]) => method === 'eq' && column === 'is_active' && value === true), `${table} must filter is_active`);
  }
  assert.ok(calls.find((entry) => entry.table === 'content_group_allowed_types'));
  assert.equal(calls.some((entry) => ['sessions', 'players', 'game_history'].includes(entry.table)), false);
});

test('repository hides raw Supabase error details behind a 503 API error', async () => {
  const { supabase } = createSupabaseMock({
    topics: { data: null, error: { code: '42501', message: 'private database detail' } }
  });
  const repository = new SupabaseContentRepository(supabase);
  await assert.rejects(repository.listActiveTopics(), (error) =>
    error.status === 503 && error.code === 'CONTENT_SERVICE_UNAVAILABLE' &&
    !error.message.includes('private database detail')
  );
});
