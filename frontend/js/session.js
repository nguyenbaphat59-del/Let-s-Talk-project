/* LET'S TALK — schema v2 Local Storage session engine (no Backend session persistence) */
(() => {
  'use strict';

  const storage = window.LTStorage;
  const api = window.LTAPI;
  if (!storage || !api) {
    console.error("[Let's Talk] LTStorage and LTAPI must load before LTSession.");
    return;
  }

  const TOPICS = Object.freeze({
    friends: Object.freeze({ label: 'Friends', icon: '♟' }),
    family: Object.freeze({ label: 'Family', icon: '⌂' })
  });

  const ACTIVE_KEY = 'letsTalk.activeSession.v2';
  const CONFIG_KEY = 'letsTalk.setupConfig.v1';
  const LAST_RESULT_KEY = 'letsTalk.lastResult.v1';
  const SESSION_SCHEMA_VERSION = 2;
  const POOL_KEYS = Object.freeze([
    'question_zone',
    'truth',
    'challenge',
    'double_challenge',
    'everyone_answers',
    'surprise_question',
    'pick_a_player_question',
    'pick_a_player_challenge',
    'hot_seat'
  ]);
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const POOL_CONTENT_TYPES = Object.freeze({
    question_zone: 'question',
    truth: 'question',
    challenge: 'challenge',
    double_challenge: 'challenge',
    everyone_answers: 'question',
    surprise_question: 'question',
    pick_a_player_question: 'question',
    pick_a_player_challenge: 'challenge',
    hot_seat: 'question'
  });

  const now = () => new Date().toISOString();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function emptyUsage() {
    return Object.fromEntries(POOL_KEYS.map((key) => [key, []]));
  }

  function writeOrThrow(key, value, message = 'Your game could not be saved in this browser. Free up storage and try again.') {
    if (!storage.write(key, value)) throw new Error(message);
    return value;
  }

  function readConfig() {
    const saved = storage.read(CONFIG_KEY, null) || storage.read(storage.keys.config, null);
    const topicCode = TOPICS[saved?.topicCode] ? saved.topicCode
      : (TOPICS[saved?.topic] ? saved.topic : 'friends');
    const sessionLength = [10, 20, 'unlimited'].includes(saved?.sessionLength)
      ? saved.sessionLength
      : ([10, 20, 'unlimited'].includes(saved?.questionCount) ? saved.questionCount : 10);
    return { topicCode, sessionLength, topic: topicCode, questionCount: sessionLength };
  }

  function saveConfig(config) {
    if (!config || !TOPICS[config.topicCode || config.topic]) return false;
    const sessionLength = config.sessionLength ?? config.questionCount;
    if (![10, 20, 'unlimited'].includes(sessionLength)) return false;
    return storage.write(CONFIG_KEY, {
      topicCode: config.topicCode || config.topic,
      sessionLength
    });
  }

  function validateUsage(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    if (keys.length !== POOL_KEYS.length || keys.some((key) => !POOL_KEYS.includes(key))) return false;
    const all = [];
    for (const key of POOL_KEYS) {
      const ids = value[key] ?? [];
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))) return false;
      all.push(...ids);
    }
    return all.length <= 880 && new Set(all).size === all.length;
  }

  function validateCurrentActivity(activity, usedContentIdsByPool) {
    if (activity === null) return true;
    if (!activity || typeof activity !== 'object' || Array.isArray(activity)) return false;
    if (!['question_zone', 'pick_your_fate', 'random_event', 'hot_seat'].includes(activity.activityFamily)) return false;

    if (activity.requiresChoice === true) {
      if (activity.activityFamily !== 'pick_your_fate' || !activity.choices || typeof activity.choices !== 'object') return false;
      return ['truth', 'challenge', 'mystery'].every((key) =>
        activity.choices[key] && typeof activity.choices[key].enabled === 'boolean'
      );
    }

    if (!POOL_KEYS.includes(activity.usedPool)) return false;
    const contentItems = Array.isArray(activity.content) ? activity.content : [activity.content];
    if (!contentItems.length || contentItems.some((item) =>
      !item || typeof item.id !== 'string' || !UUID_PATTERN.test(item.id) ||
      item.contentType !== POOL_CONTENT_TYPES[activity.usedPool] ||
      typeof item.text !== 'string' || !item.text.trim()
    )) return false;
    if (new Set(contentItems.map((item) => item.id)).size !== contentItems.length) return false;
    if (contentItems.some((item) => !usedContentIdsByPool?.[activity.usedPool]?.includes(item.id))) return false;

    if (activity.activityFamily === 'question_zone') {
      return activity.usedPool === 'question_zone' && contentItems.length === 1;
    }
    if (activity.activityFamily === 'pick_your_fate') {
      return contentItems.length === 1 && ['truth', 'challenge'].includes(activity.resolvedChoice) &&
        activity.usedPool === activity.resolvedChoice;
    }
    if (activity.activityFamily === 'hot_seat') {
      // Accept pre-change v2 snapshots with trigger="manual" so an already-open
      // Hot Seat can finish after the rule update. New API responses use automatic.
      return contentItems.length === 1 && activity.usedPool === 'hot_seat' &&
        ['automatic', 'manual'].includes(activity.trigger) &&
        typeof activity.participantInstruction === 'string' && activity.participantInstruction.length > 0;
    }
    if (activity.activityFamily === 'random_event') {
      if (activity.eventCode === 'double_challenge') {
        return activity.usedPool === 'double_challenge' && contentItems.length === 2 &&
          contentItems.every((item) => item.contentType === 'challenge');
      }
      if (activity.eventCode === 'everyone_answers' || activity.eventCode === 'surprise_question') {
        return activity.usedPool === activity.eventCode && contentItems.length === 1 && contentItems[0].contentType === 'question';
      }
      if (activity.eventCode === 'pick_a_player') {
        const expectedPool = activity.selectedContentType === 'question'
          ? 'pick_a_player_question'
          : activity.selectedContentType === 'challenge'
            ? 'pick_a_player_challenge'
            : null;
        return Boolean(expectedPool) && activity.usedPool === expectedPool && contentItems.length === 1 &&
          typeof activity.participantInstruction === 'string' && activity.participantInstruction.length > 0;
      }
    }
    return false;
  }

  function validateSession(session) {
    if (!session || typeof session !== 'object' || Array.isArray(session)) return false;
    if (session.schemaVersion !== SESSION_SCHEMA_VERSION) return false;
    if (!UUID_PATTERN.test(session.sessionId)) return false;
    if (!TOPICS[session.topicCode]) return false;
    if (![10, 20, 'unlimited'].includes(session.sessionLength)) return false;
    const target = session.sessionLength === 'unlimited' ? null : session.sessionLength;
    if (session.progressionTarget !== target) return false;
    for (const field of ['completedUnits', 'skippedUnits', 'processedTurns']) {
      if (!Number.isInteger(session[field]) || session[field] < 0) return false;
    }
    if (session.processedTurns !== session.completedUnits + session.skippedUnits) return false;
    if (session.currentTurn !== session.processedTurns + 1) return false;
    if (session.progressionTarget !== null && session.completedUnits >= session.progressionTarget) return false;
    if (!['active'].includes(session.gameStatus)) return false;
    if (!['ready', 'awaiting_fate', 'activity_active'].includes(session.currentState)) return false;
    if (!validateUsage(session.usedContentIdsByPool)) return false;
    if (!validateCurrentActivity(session.currentActivity, session.usedContentIdsByPool)) return false;
    if (session.currentState === 'ready' && session.currentActivity !== null) return false;
    if (session.currentState === 'awaiting_fate' &&
        !(session.currentActivity?.activityFamily === 'pick_your_fate' && session.currentActivity.requiresChoice === true)) return false;
    if (session.currentState === 'activity_active' && !session.currentActivity) return false;
    return true;
  }

  function getActive() {
    return storage.read(ACTIVE_KEY, null);
  }

  function persist(session) {
    if (!validateSession(session)) {
      throw new Error('The updated game state failed validation and was not saved. Please reload or start a new game.');
    }
    session.updatedAt = now();
    writeOrThrow(ACTIVE_KEY, session);
    return session;
  }

  function addUsedItems(session, poolCode, content) {
    if (!POOL_KEYS.includes(poolCode)) throw new Error('The Backend returned an unsupported content pool.');
    const items = Array.isArray(content) ? content : [content];
    const usage = session.usedContentIdsByPool;
    if (!items.length || items.some((item) => !item || !UUID_PATTERN.test(item.id) ||
      item.contentType !== POOL_CONTENT_TYPES[poolCode] || typeof item.text !== 'string' || !item.text.trim())) {
      throw new Error('The Backend returned an invalid content record.');
    }
    if (new Set(items.map((item) => item.id)).size !== items.length) {
      throw new Error('The Backend returned duplicate content IDs in one activity.');
    }
    for (const item of items) {
      const alreadyUsed = POOL_KEYS.some((key) => usage[key].includes(item.id));
      if (alreadyUsed) throw new Error('The Backend attempted to return content that was already used.');
    }
    for (const item of items) usage[poolCode].push(item.id);
  }

  async function createSession(topicCode, sessionLength, suppliedCatalog = null) {
    if (!TOPICS[topicCode]) throw new Error('Please select Friends or Family.');
    if (![10, 20, 'unlimited'].includes(sessionLength)) {
      throw new Error('Please select 10, 20 or Unlimited.');
    }

    const catalog = suppliedCatalog || await api.getCatalog(topicCode);
    if (catalog?.topic?.code !== topicCode || !catalog.pools ||
        POOL_KEYS.some((key) => !Number.isInteger(catalog.pools[key]?.available) || catalog.pools[key].available < 0)) {
      throw new Error('The selected topic catalog is incomplete or unavailable.');
    }
    const availableTotal = POOL_KEYS.reduce((sum, key) => sum + catalog.pools[key].available, 0);
    if (availableTotal < 1) throw new Error('There is no active content for this topic yet.');

    const target = sessionLength === 'unlimited' ? null : sessionLength;
    const timestamp = now();
    const session = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId: makeId(),
      topicCode,
      sessionLength,
      progressionTarget: target,
      completedUnits: 0,
      skippedUnits: 0,
      processedTurns: 0,
      gameStatus: 'active',
      currentState: 'ready',
      currentTurn: 1,
      currentActivity: null,
      usedContentIdsByPool: emptyUsage(),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    writeOrThrow(ACTIVE_KEY, session);
    // A new game is an explicit user action. Clear the legacy v1 record only now.
    storage.remove(storage.keys.activeSession);
    storage.remove(LAST_RESULT_KEY);
    return session;
  }

  async function restoreActive() {
    const session = getActive();
    if (!session) {
      const legacy = storage.read(storage.keys.activeSession, null);
      if (legacy) {
        const error = new Error('An older saved game was found. It cannot be safely continued. Start a new game to replace it.');
        error.code = 'LEGACY_SESSION';
        throw error;
      }
      return null;
    }
    if (!validateSession(session)) {
      const error = new Error('The saved game data is invalid or unsupported. Start a new game to create a clean session.');
      error.code = 'INVALID_SAVED_SESSION';
      throw error;
    }
    return session;
  }

  async function startNextActivity() {
    const session = await restoreActive();
    if (!session || session.currentState !== 'ready') {
      throw new Error('The game is not ready for a new activity.');
    }
    const response = await api.nextActivity({
      topicCode: session.topicCode,
      trigger: 'automatic',
      usedContentIdsByPool: session.usedContentIdsByPool
    });
    const updated = clone(session);
    updated.currentActivity = response;
    if (response.requiresChoice === true) {
      updated.currentState = 'awaiting_fate';
    } else {
      addUsedItems(updated, response.usedPool, response.content);
      updated.currentState = 'activity_active';
    }
    persist(updated);
    return updated;
  }

  async function resolveFate(choice) {
    const session = await restoreActive();
    if (!session || session.currentState !== 'awaiting_fate') {
      throw new Error('Pick Your Fate is not waiting for a choice.');
    }
    const response = await api.resolveFate({
      topicCode: session.topicCode,
      choice,
      usedContentIdsByPool: session.usedContentIdsByPool
    });
    const updated = clone(session);
    addUsedItems(updated, response.usedPool, response.content);
    updated.currentActivity = response;
    updated.currentState = 'activity_active';
    persist(updated);
    return updated;
  }

  async function nextQuestionZone() {
    const session = await restoreActive();
    if (!session || session.currentState !== 'activity_active' ||
        session.currentActivity?.activityFamily !== 'question_zone') {
      throw new Error('Next Question is only available during a Question Zone activity.');
    }
    const response = await api.nextQuestionZone({
      topicCode: session.topicCode,
      usedContentIdsByPool: session.usedContentIdsByPool
    });
    const updated = clone(session);
    addUsedItems(updated, response.usedPool, response.content);
    updated.currentActivity = response;
    persist(updated);
    return updated;
  }

  function saveLastResult(session, endReason) {
    const result = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId: session.sessionId,
      topicCode: session.topicCode,
      sessionLength: session.sessionLength,
      progressionTarget: session.progressionTarget,
      completedUnits: session.completedUnits,
      skippedUnits: session.skippedUnits,
      processedTurns: session.processedTurns,
      endReason,
      completedAt: now()
    };
    writeOrThrow(LAST_RESULT_KEY, result, 'The game result could not be saved. Please try again.');
    return result;
  }

  function finalize(session, endReason) {
    const result = saveLastResult(session, endReason);
    if (!storage.remove(ACTIVE_KEY)) {
      storage.remove(LAST_RESULT_KEY);
      throw new Error('The game could not be closed safely in this browser. Please try again.');
    }
    return result;
  }

  function completeActivity(completed) {
    const session = getActive();
    if (!validateSession(session) || session.currentState !== 'activity_active') {
      throw new Error('There is no active activity to process.');
    }
    const updated = clone(session);
    if (completed) updated.completedUnits += 1;
    else updated.skippedUnits += 1;
    updated.processedTurns += 1;
    updated.currentTurn = updated.processedTurns + 1;
    updated.currentActivity = null;
    updated.currentState = 'ready';

    if (updated.progressionTarget !== null && updated.completedUnits >= updated.progressionTarget) {
      updated.gameStatus = 'completed';
      return { finished: true, result: finalize(updated, 'target_reached') };
    }

    persist(updated);
    return { finished: false, session: updated };
  }

  function completeFateSkip() {
    const session = getActive();
    if (!validateSession(session) || session.currentState !== 'awaiting_fate') {
      throw new Error('There is no Pick Your Fate activity to skip.');
    }
    const updated = clone(session);
    updated.skippedUnits += 1;
    updated.processedTurns += 1;
    updated.currentTurn = updated.processedTurns + 1;
    updated.currentActivity = null;
    updated.currentState = 'ready';
    persist(updated);
    return { finished: false, session: updated };
  }

  function finishContentExhausted() {
    const session = getActive();
    if (!validateSession(session)) throw new Error('There is no valid active session.');
    session.gameStatus = 'content_exhausted';
    const result = finalize(session, 'content_exhausted');
    return result;
  }

  function endEarly() {
    const session = getActive();
    if (!validateSession(session)) throw new Error('There is no valid active session.');
    session.gameStatus = 'completed';
    return finalize(session, 'ended_early');
  }

  function finishExit() {
    if (!storage.remove(ACTIVE_KEY)) {
      throw new Error('The current game could not be cleared from this browser. Please try again.');
    }
    storage.remove(storage.keys.activeSession);
    sessionStorage.removeItem('letsTalk.playIntro');
  }

  function getLastResult() {
    const result = storage.read(LAST_RESULT_KEY, null);
    if (!result || result.schemaVersion !== SESSION_SCHEMA_VERSION ||
        !TOPICS[result.topicCode] || !['target_reached', 'ended_early', 'content_exhausted'].includes(result.endReason)) {
      return null;
    }
    return result;
  }

  function clearLastResult() {
    return storage.remove(LAST_RESULT_KEY);
  }

  window.LTSession = Object.freeze({
    TOPICS,
    POOL_KEYS,
    ACTIVE_KEY,
    CONFIG_KEY,
    LAST_RESULT_KEY,
    createSession,
    restoreActive,
    getActive,
    getConfig: readConfig,
    saveConfig,
    startNextActivity,
    resolveFate,
    nextQuestionZone,
    completeActivity,
    completeFateSkip,
    finishContentExhausted,
    endEarly,
    finishExit,
    getLastResult,
    clearLastResult
  });
})();
