/* LET'S TALK — Google Analytics 4 (gtag.js) and gameplay event tracking.
 *
 * Enabled only when LT_CONFIG.gaMeasurementId is a valid "G-…" ID and the page is
 * not a local preview (unless LT_CONFIG.analyticsInDevelopment is true).
 * gtag.js is loaded after the window "load" event so it does not compete with
 * the page's own resources (Lighthouse). Events raised earlier are queued in
 * window.dataLayer and sent once gtag.js arrives.
 *
 * Tracked events (no personal data is collected):
 *   page_view (automatic)             select_topic {topic}
 *   select_session_length {length}     game_start {topic, session_length}
 *   turn_start                         activity_drawn {activity_family, event_code}
 *   fate_choice {choice}               next_question
 *   activity_complete / activity_skip  game_exit / game_end {reason}
 *   game_complete {topic, session_length, end_reason, completed, skipped}
 *   play_again / back_to_home          rules_open / intro_skip
 *   api_error {endpoint, error_code, http_status}
 */
(() => {
  'use strict';

  const config = window.LT_CONFIG || {};
  const id = String(config.gaMeasurementId || '').trim();
  const validId = /^G-[A-Z0-9]{4,}$/i.test(id);
  const allowedHere = config.environment !== 'development' || config.analyticsInDevelopment === true;
  const enabled = validId && allowedHere;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); } // eslint-disable-line prefer-rest-params

  function track(name, params = {}) {
    if (!enabled) return false;
    gtag('event', name, params);
    return true;
  }

  if (enabled) {
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id, { app_environment: config.environment });

    const load = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);
    };
    if (document.readyState === 'complete') setTimeout(load, 0);
    else window.addEventListener('load', () => setTimeout(load, 0), { once: true });
  }

  // --- UI interactions (event delegation, capture phase so the event is recorded
  //     even if the clicked element is replaced by the page script). ---
  const selectedTopic = () => document.querySelector('[data-topic].selected')?.dataset.topic;
  const selectedLength = () => document.querySelector('[data-count].selected')?.dataset.count;

  const BUTTON_EVENTS = {
    'start-game-btn': () => ['game_start', { topic: selectedTopic(), session_length: selectedLength() }],
    'start-turn-btn': () => ['turn_start'],
    'activity-complete-btn': () => ['activity_complete'],
    'activity-skip-btn': () => ['activity_skip'],
    'fate-skip-btn': () => ['activity_skip', { stage: 'pick_your_fate' }],
    'confirm-exit-btn': () => ['game_exit'],
    'confirm-end-btn': () => ['game_end', { reason: 'end_game' }],
    'play-again-btn': () => ['play_again'],
    'back-home-btn': () => ['back_to_home'],
    'open-rules-btn': () => ['rules_open'],
    'skip-intro-btn': () => ['intro_skip']
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const button = target.closest('button');
    if (!button || button.disabled) return;

    if (button.dataset.topic) return void track('select_topic', { topic: button.dataset.topic });
    if (button.dataset.count) return void track('select_session_length', { length: button.dataset.count });
    if (button.dataset.fate) return void track('fate_choice', { choice: button.dataset.fate });

    const factory = BUTTON_EVENTS[button.id];
    if (factory) {
      const [name, params] = factory();
      track(name, params);
    }
  }, true);

  // --- Results reported by the API wrapper in monitoring.js ---
  function trackApiResult(endpoint, request, result) {
    if (endpoint === 'nextActivity' && result?.activityFamily) {
      track('activity_drawn', {
        activity_family: result.activityFamily,
        event_code: result.eventCode || undefined
      });
    } else if (endpoint === 'nextQuestionZone') {
      track('next_question');
    }
  }

  // --- Completion page: one summary event per finished session ---
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('page-complete') &&
        !/game-complete(\.html)?$/.test(window.location.pathname)) return;
    const result = window.LTSession?.getLastResult?.();
    if (!result) return;
    try {
      const key = 'letsTalk.analytics.lastCompleteSent';
      if (window.sessionStorage.getItem(key) === result.sessionId) return; // page refresh
      window.sessionStorage.setItem(key, result.sessionId);
    } catch { /* storage unavailable: send anyway */ }
    track('game_complete', {
      topic: result.topicCode,
      session_length: String(result.sessionLength),
      end_reason: result.endReason,
      completed: result.completedUnits,
      skipped: result.skippedUnits
    });
  });

  window.LTAnalytics = Object.freeze({ enabled, track, trackApiResult });
})();
