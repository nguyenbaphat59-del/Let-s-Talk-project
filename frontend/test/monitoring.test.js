import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, 'frontend/js', file), 'utf8');
const sources = {
  monitoring: read('monitoring.js'),
  analytics: read('analytics.js'),
  api: read('api.js')
};

function createBrowser({ config = {}, fetchImpl, hostname = 'lets-talk.example' } = {}) {
  const appended = [];
  const listeners = {};
  const consoleLines = [];
  const window = {
    location: { protocol: 'https:', port: '', hostname, origin: `https://${hostname}`, pathname: '/index.html' },
    LT_CONFIG: Object.freeze({ environment: 'production', release: 'test', ...config }),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    sessionStorage: { getItem: () => null, setItem: () => {} }
  };
  const document = {
    readyState: 'loading',
    head: { appendChild: (el) => appended.push(el) },
    body: { classList: { contains: () => false } },
    createElement: (tag) => ({ tag, setAttribute(name, value) { this[name] = value; } }),
    addEventListener: (type, fn) => { (listeners[`document:${type}`] ||= []).push(fn); },
    querySelector: () => null
  };
  const fakeConsole = {
    error: (...args) => consoleLines.push(['error', ...args]),
    warn: (...args) => consoleLines.push(['warn', ...args]),
    log: () => {}
  };
  const context = vm.createContext({
    window, document, console: fakeConsole, performance: { now: () => 0 },
    URL, Object, String, Error, Set, Number, Math, JSON, Date, Promise, encodeURIComponent,
    setTimeout: (fn) => fn(), Element: class {},
    fetch: fetchImpl || (async () => { throw new Error('no network'); })
  });
  const run = (name) => vm.runInContext(sources[name], context, { filename: `${name}.js` });
  return { window, document, appended, listeners, consoleLines, run };
}

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });

test('monitoring is disabled without a DSN and never loads the Sentry script', () => {
  const browser = createBrowser();
  browser.run('monitoring');
  assert.equal(browser.window.LTMonitor.enabled, false);
  assert.equal(browser.appended.length, 0);
});

test('monitoring loads the Sentry Loader Script derived from the DSN public key', () => {
  const browser = createBrowser({ config: { sentryDsn: 'https://0123456789abcdef0123456789abcdef@o42.ingest.us.sentry.io/99' } });
  browser.run('monitoring');
  assert.equal(browser.window.LTMonitor.enabled, true);
  assert.equal(browser.appended[0].src, 'https://js.sentry-cdn.com/0123456789abcdef0123456789abcdef.min.js');
  assert.equal(typeof browser.window.sentryOnLoad, 'function');
});

test('an invalid DSN disables monitoring with a console warning', () => {
  const browser = createBrowser({ config: { sentryDsn: 'not-a-dsn' } });
  browser.run('monitoring');
  assert.equal(browser.window.LTMonitor.enabled, false);
  assert.equal(browser.appended.length, 0);
  assert.ok(browser.consoleLines.some(([level]) => level === 'warn'));
});

test('API wrapper keeps results unchanged and re-throws the original ApiError', async () => {
  let call = 0;
  const browser = createBrowser({
    fetchImpl: async () => (++call === 1
      ? jsonResponse(200, { data: { status: 'ok' }, meta: { requestId: 'a' } })
      : jsonResponse(503, { error: { code: 'CONTENT_SERVICE_UNAVAILABLE', message: 'down', requestId: 'req-503' } }))
  });
  browser.run('monitoring');
  browser.run('api');
  assert.deepEqual(await browser.window.LTAPI.getHealth(), { status: 'ok' });
  await assert.rejects(browser.window.LTAPI.getHealth(), (error) => {
    assert.equal(error.name, 'ApiError');
    assert.equal(error.requestId, 'req-503');
    return true;
  });
  const logged = browser.consoleLines.find(([level]) => level === 'error');
  assert.ok(logged, 'unexpected API failure is logged as an error');
  assert.ok(browser.window.LTAPI.ApiError, 'ApiError class is still exposed');
});

test('expected gameplay conditions are not reported as errors', async () => {
  const browser = createBrowser({
    fetchImpl: async () => jsonResponse(409, { error: { code: 'NO_ELIGIBLE_ACTIVITY', message: 'done', requestId: 'r' } })
  });
  browser.run('monitoring');
  browser.run('api');
  await assert.rejects(browser.window.LTAPI.nextActivity({}));
  assert.equal(browser.consoleLines.filter(([level]) => level === 'error').length, 0);
  assert.equal(browser.consoleLines.filter(([level]) => level === 'warn').length, 1);
});

test('errors raised before Sentry is ready are buffered and sent after sentryOnLoad', async () => {
  const browser = createBrowser({
    config: { sentryDsn: 'https://0123456789abcdef0123456789abcdef@o42.ingest.sentry.io/99' },
    fetchImpl: async () => { throw new TypeError('Failed to fetch'); }
  });
  browser.run('monitoring');
  browser.run('api');
  await assert.rejects(browser.window.LTAPI.getTopics());
  const captured = [];
  browser.window.Sentry = {
    init: () => {}, setTag: () => {}, addBreadcrumb: () => {},
    withScope: (fn) => fn({ setTag() {}, setContext() {}, setLevel() {} }),
    captureException: (error) => captured.push(error)
  };
  browser.window.sentryOnLoad();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].code, 'NETWORK_ERROR');
});

test('analytics is disabled without a Measurement ID', () => {
  const browser = createBrowser();
  browser.run('analytics');
  assert.equal(browser.window.LTAnalytics.enabled, false);
  assert.equal(browser.window.LTAnalytics.track('game_start'), false);
  assert.equal(browser.appended.length, 0);
});

test('analytics queues gtag events and loads gtag.js after page load', () => {
  const browser = createBrowser({ config: { gaMeasurementId: 'G-TEST1234' } });
  browser.run('analytics');
  assert.equal(browser.window.LTAnalytics.enabled, true);
  assert.equal(browser.window.LTAnalytics.track('game_start', { topic: 'friends' }), true);
  const events = browser.window.dataLayer.map((args) => Array.from(args));
  assert.deepEqual(events.at(-1), ['event', 'game_start', { topic: 'friends' }]);
  assert.equal(browser.appended.length, 0, 'gtag.js waits for the load event');
  browser.listeners.load.forEach((fn) => fn());
  assert.match(browser.appended[0].src, /googletagmanager\.com\/gtag\/js\?id=G-TEST1234$/);
});

test('analytics stays off on local previews unless explicitly enabled', () => {
  const local = createBrowser({ config: { gaMeasurementId: 'G-TEST1234', environment: 'development' } });
  local.run('analytics');
  assert.equal(local.window.LTAnalytics.enabled, false);
  const opted = createBrowser({ config: { gaMeasurementId: 'G-TEST1234', environment: 'development', analyticsInDevelopment: true } });
  opted.run('analytics');
  assert.equal(opted.window.LTAnalytics.enabled, true);
});

test('API results are converted into activity analytics events', () => {
  const browser = createBrowser({ config: { gaMeasurementId: 'G-TEST1234' } });
  browser.run('analytics');
  browser.window.LTAnalytics.trackApiResult('nextActivity', {}, { activityFamily: 'random_event', eventCode: 'double_challenge' });
  const last = JSON.parse(JSON.stringify(Array.from(browser.window.dataLayer.at(-1)))); // cross-realm copy
  assert.deepEqual(last, ['event', 'activity_drawn', { activity_family: 'random_event', event_code: 'double_challenge' }]);
});
