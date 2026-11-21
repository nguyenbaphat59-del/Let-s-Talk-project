/* LET'S TALK — Frontend error monitoring (Sentry) and API failure logging.
 *
 * Loaded before storage.js/api.js on every page. Responsibilities:
 *  1. Load the Sentry Loader Script when LT_CONFIG.sentryDsn is set.
 *  2. Buffer uncaught errors / unhandled promise rejections that happen before
 *     the Sentry SDK has finished loading, then send them once it is ready.
 *  3. Wrap the API client (window.LTAPI) so every failed API call is logged with
 *     the endpoint, HTTP status, error code and the Backend requestId. The same
 *     requestId appears in the Backend log line, so a browser error can be
 *     traced to the exact server request.
 *
 * Without a DSN, nothing is sent anywhere; failures are still written to the
 * browser console in a structured form for local debugging.
 */
(() => {
  'use strict';

  const config = window.LT_CONFIG || {};
  const MAX_BUFFER = 20;
  const buffer = [];
  let sentryReady = false;

  // Errors that are expected parts of the game flow, not defects.
  const EXPECTED_API_CODES = new Set(['NO_ELIGIBLE_ACTIVITY', 'CONTENT_POOL_EXHAUSTED', 'RATE_LIMITED']);

  function parseDsn(dsn) {
    const match = /^https:\/\/([0-9a-f]{16,64})@[^/\s]+\/\d+$/i.exec(String(dsn || '').trim());
    return match ? { publicKey: match[1] } : null;
  }

  function page() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    return file.replace(/\.html$/, '') || 'index';
  }

  function send(kind, payload) {
    const Sentry = window.Sentry;
    if (!sentryReady || !Sentry) {
      if (buffer.length < MAX_BUFFER) buffer.push([kind, payload]);
      return;
    }
    if (kind === 'exception') {
      Sentry.withScope((scope) => {
        Object.entries(payload.tags || {}).forEach(([key, value]) => scope.setTag(key, String(value)));
        if (payload.extra) scope.setContext('details', payload.extra);
        if (payload.level) scope.setLevel(payload.level);
        Sentry.captureException(payload.error);
      });
    } else if (kind === 'breadcrumb') {
      Sentry.addBreadcrumb(payload);
    }
  }

  function captureError(error, context = {}) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[LET\'S TALK] Error', { message: err.message, page: page(), ...context });
    send('exception', {
      error: err,
      tags: { page: page(), ...(context.tags || {}) },
      extra: context.extra,
      level: context.level
    });
  }

  function addBreadcrumb(category, message, data) {
    send('breadcrumb', { category, message, data, level: 'info' });
  }

  // 1. Uncaught errors before the SDK is ready (afterwards the SDK handles them).
  window.addEventListener('error', (event) => {
    if (sentryReady) return;
    if (event.error) captureError(event.error, { tags: { source: 'window.onerror' } });
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (sentryReady) return;
    captureError(event.reason, { tags: { source: 'unhandledrejection' } });
  });

  // 2. Sentry Loader Script.
  const dsnInfo = parseDsn(config.sentryDsn);
  if (config.sentryDsn && !dsnInfo) {
    console.warn('[LET\'S TALK] LT_CONFIG.sentryDsn is not a valid Sentry DSN; monitoring is disabled.');
  }
  if (dsnInfo) {
    window.sentryOnLoad = function sentryOnLoad() {
      window.Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment || 'production',
        release: config.release,
        sendDefaultPii: false,
        // Gameplay text is user-facing content, not personal data, but keep URLs only.
        beforeBreadcrumb(breadcrumb) {
          if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') return null;
          return breadcrumb;
        }
      });
      window.Sentry.setTag('page', page());
      sentryReady = true;
      buffer.splice(0).forEach(([kind, payload]) => send(kind, payload));
    };
    const script = document.createElement('script');
    script.src = `https://js.sentry-cdn.com/${dsnInfo.publicKey}.min.js`;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-lazy', 'no');
    document.head.appendChild(script);
  }

  // 3. API client wrapper. api.js assigns window.LTAPI once; the setter wraps it
  //    before session.js / page scripts read it. Behaviour and return values are
  //    unchanged — errors are logged and re-thrown to the original caller.
  function wrapApi(api) {
    if (!api || typeof api !== 'object') return api;
    const wrapped = { ...api };
    for (const [name, fn] of Object.entries(api)) {
      if (typeof fn !== 'function' || name === 'ApiError') continue;
      wrapped[name] = async (...args) => {
        const started = performance.now();
        try {
          const result = await fn(...args);
          addBreadcrumb('api', `${name} ok`, { durationMs: Math.round(performance.now() - started) });
          window.LTAnalytics?.trackApiResult?.(name, args[0], result);
          return result;
        } catch (error) {
          const details = {
            endpoint: name,
            status: error?.status ?? 0,
            code: error?.code || 'UNKNOWN',
            requestId: error?.requestId,
            durationMs: Math.round(performance.now() - started)
          };
          window.LTAnalytics?.track?.('api_error', { endpoint: name, error_code: details.code, http_status: details.status });
          const unexpected = !EXPECTED_API_CODES.has(details.code);
          if (unexpected) {
            captureError(error, {
              tags: { endpoint: name, api_code: details.code, http_status: details.status },
              extra: details,
              level: details.status === 0 || details.status >= 500 ? 'error' : 'warning'
            });
          } else {
            console.warn('[LET\'S TALK] Expected API condition', details);
            addBreadcrumb('api', `${name} ${details.code}`, details);
          }
          throw error;
        }
      };
    }
    return Object.freeze(wrapped);
  }

  let apiClient;
  Object.defineProperty(window, 'LTAPI', {
    configurable: true,
    enumerable: true,
    get: () => apiClient,
    set: (value) => { apiClient = wrapApi(value); }
  });

  window.LTMonitor = Object.freeze({
    enabled: Boolean(dsnInfo),
    captureError,
    addBreadcrumb,
    parseDsn
  });
})();
