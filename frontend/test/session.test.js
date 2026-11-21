import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(projectRoot, 'frontend/js/session.js'), 'utf8');

function createHarness(apiOverrides = {}) {
  const records = new Map();
  const storage = {
    keys: { config: 'letsTalk.config', activeSession: 'letsTalk.activeSession', lastResult: 'letsTalk.lastResult' },
    read(key, fallback = null) {
      const value = records.get(key);
      return value === undefined ? fallback : structuredClone(value);
    },
    write(key, value) {
      records.set(key, structuredClone(value));
      return true;
    },
    remove(key) {
      records.delete(key);
      return true;
    }
  };
  let nextNumber = 1;
  const uuid = () => {
    const tail = (nextNumber++).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${tail}`;
  };
  let activityNumber = 1;
  const api = {
    async getCatalog(topicCode) {
      return {
        topic: { code: topicCode, name: topicCode === 'friends' ? 'Friends' : 'Family' },
        pools: Object.fromEntries([
          'question_zone','truth','challenge','double_challenge','everyone_answers',
          'surprise_question','pick_a_player_question','pick_a_player_challenge','hot_seat'
        ].map((key) => [key, { available: 50 }]))
      };
    },
    async nextActivity({ trigger }) {
      assert.equal(trigger, 'automatic');
      return {
        activityFamily: 'question_zone',
        content: { id: uuid(), contentType: 'question', text: `Question ${activityNumber++}` },
        usedPool: 'question_zone'
      };
    },
    async resolveFate() {
      return {
        activityFamily: 'pick_your_fate',
        resolvedChoice: 'truth',
        content: { id: uuid(), contentType: 'question', text: 'A truth question' },
        usedPool: 'truth'
      };
    },
    async nextQuestionZone() {
      return {
        activityFamily: 'question_zone',
        content: { id: uuid(), contentType: 'question', text: 'Replacement question' },
        usedPool: 'question_zone'
      };
    },
    ...apiOverrides
  };
  const window = {
    LTStorage: storage,
    LTAPI: api,
    crypto: { randomUUID: uuid, getRandomValues: webcrypto.getRandomValues.bind(webcrypto) }
  };
  const sessionStorage = {
    removeItem() {}
  };
  vm.runInNewContext(source, {
    window,
    sessionStorage,
    console,
    Date,
    JSON,
    Math,
    Uint8Array,
    Object,
    Array,
    Set,
    Number,
    String,
    Error
  }, { filename: 'frontend/js/session.js' });
  return { LTSession: window.LTSession, storage, records };
}

test('Local session uses schema v2 and stores only in browser storage', async () => {
  const { LTSession, storage } = createHarness();
  const catalog = await LTSession.createSession('friends', 10);
  assert.equal(LTSession.ACTIVE_KEY, 'letsTalk.activeSession.v2');
  assert.equal(LTSession.CONFIG_KEY, 'letsTalk.setupConfig.v1');
  assert.equal(LTSession.LAST_RESULT_KEY, 'letsTalk.lastResult.v1');
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.sessionLength, 10);
  assert.equal(catalog.completedUnits, 0);
  assert.equal(catalog.skippedUnits, 0);
  assert.equal(catalog.processedTurns, 0);
  assert.equal(catalog.currentState, 'ready');
  assert.equal(Object.keys(catalog.usedContentIdsByPool).length, 9);
  assert.equal(storage.read(LTSession.ACTIVE_KEY).sessionId, catalog.sessionId);
});

test('Starting a prompt persists its content ID before displaying it', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('friends', 10);
  const active = await LTSession.startNextActivity();
  assert.equal(active.currentState, 'activity_active');
  assert.equal(active.usedContentIdsByPool.question_zone.length, 1);
  assert.equal(active.currentActivity.content.id, active.usedContentIdsByPool.question_zone[0]);
});

test('Next Question consumes a new prompt without processing a turn', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('friends', 10);
  await LTSession.startNextActivity();
  const updated = await LTSession.nextQuestionZone();
  assert.equal(updated.usedContentIdsByPool.question_zone.length, 2);
  assert.equal(updated.processedTurns, 0);
  assert.equal(updated.completedUnits, 0);
  assert.equal(updated.skippedUnits, 0);
  assert.equal(updated.currentState, 'activity_active');
});

test('Skip increments skipped and processed but not completed target', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('family', 10);
  await LTSession.startNextActivity();
  const result = LTSession.completeActivity(false);
  assert.equal(result.finished, false);
  assert.equal(result.session.completedUnits, 0);
  assert.equal(result.session.skippedUnits, 1);
  assert.equal(result.session.processedTurns, 1);
  assert.equal(result.session.currentTurn, 2);
  assert.equal(result.session.currentState, 'ready');
});

test('Complete increments completed and processed exactly once', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('friends', 10);
  await LTSession.startNextActivity();
  const result = LTSession.completeActivity(true);
  assert.equal(result.finished, false);
  assert.equal(result.session.completedUnits, 1);
  assert.equal(result.session.skippedUnits, 0);
  assert.equal(result.session.processedTurns, 1);
  assert.equal(result.session.currentTurn, 2);
});

test('Pick Your Fate selection and resolution are persisted separately', async () => {
  const { LTSession } = createHarness({
    async nextActivity() {
      return {
        activityFamily: 'pick_your_fate',
        requiresChoice: true,
        choices: {
          truth: { enabled: true },
          challenge: { enabled: true },
          mystery: { enabled: true, probability: '50/50' }
        }
      };
    }
  });
  await LTSession.createSession('friends', 10);
  const waiting = await LTSession.startNextActivity();
  assert.equal(waiting.currentState, 'awaiting_fate');
  assert.deepEqual(Object.keys(waiting.usedContentIdsByPool.truth), []);
  const resolved = await LTSession.resolveFate('mystery');
  assert.equal(resolved.currentState, 'activity_active');
  assert.equal(resolved.currentActivity.resolvedChoice, 'truth');
  assert.equal(resolved.usedContentIdsByPool.truth.length, 1);
});

test('Hot Seat is returned by the automatic selector and tracked in its own pool', async () => {
  let requestTrigger = null;
  const { LTSession } = createHarness({
    async nextActivity({ trigger }) {
      requestTrigger = trigger;
      return {
        activityFamily: 'hot_seat',
        trigger: 'automatic',
        content: { id: '00000000-0000-4000-8000-000000000099', contentType: 'question', text: 'A Hot Seat prompt' },
        usedPool: 'hot_seat',
        participantInstruction: 'The group chooses who takes the Hot Seat. The participant may pass.'
      };
    }
  });
  await LTSession.createSession('friends', 'unlimited');
  const active = await LTSession.startNextActivity();
  assert.equal(requestTrigger, 'automatic');
  assert.equal(active.currentActivity.activityFamily, 'hot_seat');
  assert.equal(active.currentState, 'activity_active');
  assert.equal(active.usedContentIdsByPool.hot_seat.length, 1);
  assert.equal(active.usedContentIdsByPool.question_zone.length, 0);
});

test('Passing a Hot Seat activity is counted as Skip, not Completed', async () => {
  const { LTSession } = createHarness({
    async nextActivity() {
      return {
        activityFamily: 'hot_seat',
        trigger: 'automatic',
        content: {
          id: '00000000-0000-4000-8000-000000000098',
          contentType: 'question',
          text: 'A Hot Seat prompt'
        },
        usedPool: 'hot_seat',
        participantInstruction: 'The group chooses who takes the Hot Seat. The participant may pass.'
      };
    }
  });
  await LTSession.createSession('friends', 10);
  await LTSession.startNextActivity();
  const result = LTSession.completeActivity(false);
  assert.equal(result.session.completedUnits, 0);
  assert.equal(result.session.skippedUnits, 1);
  assert.equal(result.session.processedTurns, 1);
  assert.equal(result.session.usedContentIdsByPool.hot_seat.length, 1);
});

test('Finite session completes only after the target number of completed activities', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('friends', 10);
  let result;
  for (let index = 0; index < 9; index += 1) {
    await LTSession.startNextActivity();
    result = LTSession.completeActivity(true);
    assert.equal(result.finished, false);
  }
  await LTSession.startNextActivity();
  result = LTSession.completeActivity(true);
  assert.equal(result.finished, true);
  assert.equal(result.result.endReason, 'target_reached');
  assert.equal(result.result.completedUnits, 10);
  assert.equal(result.result.processedTurns, 10);
  assert.equal(LTSession.getActive(), null);
  assert.equal(LTSession.getLastResult().sessionLength, 10);
});

test('End Game stores result without counting an incomplete activity', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('family', 20);
  await LTSession.startNextActivity();
  const result = LTSession.endEarly();
  assert.equal(result.endReason, 'ended_early');
  assert.equal(result.completedUnits, 0);
  assert.equal(result.skippedUnits, 0);
  assert.equal(LTSession.getActive(), null);
});

test('Legacy v1 session is not automatically migrated or removed', async () => {
  const { LTSession, storage } = createHarness();
  storage.write(storage.keys.activeSession, { schemaVersion: 1, sequence: [] });
  await assert.rejects(
    LTSession.restoreActive(),
    (error) => error.code === 'LEGACY_SESSION'
  );
  assert.deepEqual(storage.read(storage.keys.activeSession), { schemaVersion: 1, sequence: [] });
});

test('Unlimited content exhaustion records the honest ending reason', async () => {
  const { LTSession } = createHarness();
  await LTSession.createSession('friends', 'unlimited');
  await LTSession.startNextActivity();
  const result = LTSession.finishContentExhausted();
  assert.equal(result.endReason, 'content_exhausted');
  assert.equal(LTSession.getActive(), null);
});


test('Double Challenge consumes both distinct content IDs from its dedicated pool', async () => {
  let id = 100;
  const { LTSession } = createHarness({
    async nextActivity() {
      const first = `00000000-0000-4000-8000-${(id++).toString(16).padStart(12, '0')}`;
      const second = `00000000-0000-4000-8000-${(id++).toString(16).padStart(12, '0')}`;
      return {
        activityFamily: 'random_event',
        eventCode: 'double_challenge',
        content: [
          { id: first, contentType: 'challenge', text: 'Challenge one' },
          { id: second, contentType: 'challenge', text: 'Challenge two' }
        ],
        usedPool: 'double_challenge'
      };
    }
  });
  await LTSession.createSession('friends', 10);
  const active = await LTSession.startNextActivity();
  assert.equal(active.currentActivity.content.length, 2);
  assert.equal(active.usedContentIdsByPool.double_challenge.length, 2);
  assert.notEqual(active.usedContentIdsByPool.double_challenge[0], active.usedContentIdsByPool.double_challenge[1]);
  assert.equal(active.processedTurns, 0);
});

test('setup configuration reads the legacy preference but writes the documented v1 key', async () => {
  const { LTSession, storage } = createHarness();
  storage.write(storage.keys.config, { topic: 'family', questionCount: 20 });
  assert.equal(LTSession.getConfig().topicCode, 'family');
  assert.equal(LTSession.getConfig().sessionLength, 20);
  assert.equal(LTSession.saveConfig({ topicCode: 'friends', sessionLength: 10 }), true);
  assert.deepEqual(storage.read(LTSession.CONFIG_KEY), { topicCode: 'friends', sessionLength: 10 });
});

test('restoration rejects tampered or cross-pool duplicate usage data', async () => {
  const { LTSession, storage } = createHarness();
  const created = await LTSession.createSession('friends', 10);
  const corrupted = structuredClone(created);
  corrupted.usedContentIdsByPool.question_zone = ['not-a-uuid'];
  storage.write(LTSession.ACTIVE_KEY, corrupted);
  await assert.rejects(LTSession.restoreActive(), (error) => error.code === 'INVALID_SAVED_SESSION');
});

test('session rejects duplicate IDs returned inside a Double Challenge response', async () => {
  const item = {
    id: '00000000-0000-4000-8000-000000000201',
    contentType: 'challenge',
    text: 'A challenge'
  };
  const { LTSession, storage } = createHarness({
    async nextActivity() {
      return {
        activityFamily: 'random_event',
        eventCode: 'double_challenge',
        content: [item, item],
        usedPool: 'double_challenge'
      };
    }
  });
  await LTSession.createSession('friends', 10);
  await assert.rejects(LTSession.startNextActivity(), /duplicate content IDs/);
  assert.equal(storage.read(LTSession.ACTIVE_KEY).currentState, 'ready');
  assert.deepEqual(storage.read(LTSession.ACTIVE_KEY).usedContentIdsByPool.double_challenge, []);
});

test('session rejects a saved usage snapshot with a missing pool key', async () => {
  const { LTSession, storage } = createHarness();
  const created = await LTSession.createSession('friends', 10);
  const corrupted = structuredClone(created);
  delete corrupted.usedContentIdsByPool.hot_seat;
  storage.write(LTSession.ACTIVE_KEY, corrupted);
  await assert.rejects(LTSession.restoreActive(), (error) => error.code === 'INVALID_SAVED_SESSION');
});
