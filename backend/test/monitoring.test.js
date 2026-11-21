import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { readBackendEnv } from "../src/config/env.js";
import { initMonitoring } from "../src/config/monitoring.js";
import { makeService } from "./helpers.js";

const baseEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example"
};

function silentLogger() {
  const lines = [];
  const push = (line) => lines.push(line);
  return { lines, log: push, info: push, warn: push, error: push };
}

async function withApp(appOptions, callback) {
  const app = createApp({ nodeEnv: "test", ...appOptions });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("SENTRY_DSN is optional and accepted when it is a valid DSN", () => {
  assert.equal(readBackendEnv(baseEnv).sentryDsn, "");
  const env = readBackendEnv({ ...baseEnv, SENTRY_DSN: "https://abc123def456abc123def456abc123de@o12345.ingest.sentry.io/678" });
  assert.match(env.sentryDsn, /^https:\/\/abc123/);
});

test("invalid SENTRY_DSN fails fast at startup", () => {
  for (const value of ["not-a-url", "http://key@o1.ingest.sentry.io/1", "https://o1.ingest.sentry.io/1", "https://key@o1.ingest.sentry.io/project"]) {
    assert.throws(() => readBackendEnv({ ...baseEnv, SENTRY_DSN: value }), /SENTRY_DSN/);
  }
});

test("monitoring without a DSN is disabled and logs locally", async () => {
  const logger = silentLogger();
  const monitoring = await initMonitoring({ dsn: "", logger });
  assert.equal(monitoring.enabled, false);
  monitoring.reportError(new Error("boom"), { requestId: "r-1", path: "/api/v1/x" });
  const entry = JSON.parse(logger.lines[0]);
  assert.equal(entry.level, "error");
  assert.equal(entry.requestId, "r-1");
  assert.equal(entry.errorMessage, "boom");
});

test("unexpected failures are reported with requestId and still return the safe 500 envelope", async () => {
  const { service } = makeService();
  const reported = [];
  service.listTopics = async () => { throw new Error("database exploded"); };
  await withApp({
    gameplayService: service,
    reportError: (error, context) => reported.push({ error, context })
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/topics`);
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.doesNotMatch(JSON.stringify(body), /database exploded/);
    assert.equal(reported.length, 1);
    assert.equal(reported[0].context.requestId, body.error.requestId);
    assert.equal(reported[0].context.method, "GET");
    assert.equal(reported[0].context.path, "/api/v1/topics");
  });
});

test("expected client errors (4xx) are not reported to monitoring", async () => {
  const { service } = makeService();
  const reported = [];
  await withApp({ gameplayService: service, reportError: (error) => reported.push(error) }, async (baseUrl) => {
    const notFound = await fetch(`${baseUrl}/api/v1/does-not-exist`);
    assert.equal(notFound.status, 404);
    const badJson = await fetch(`${baseUrl}/api/v1/gameplay/next-activity`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{"
    });
    assert.equal(badJson.status, 400);
  });
  assert.equal(reported.length, 0);
});

test("a throwing reporter never breaks the API response", async () => {
  const { service } = makeService();
  service.listTopics = async () => { throw new Error("fail"); };
  await withApp({ gameplayService: service, reportError: () => { throw new Error("reporter down"); } }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/topics`);
    assert.equal(response.status, 500);
  });
});

test("request logger writes one structured JSON line per request with requestId", async () => {
  const { service } = makeService();
  const logger = silentLogger();
  await withApp({ gameplayService: service, logger, requestLogging: true }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const requestId = response.headers.get("x-request-id");
    await response.json();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const entries = logger.lines.map((line) => JSON.parse(line));
    const entry = entries.find((item) => item.requestId === requestId);
    assert.ok(entry, "access log entry exists");
    assert.equal(entry.method, "GET");
    assert.equal(entry.path, "/api/v1/health");
    assert.equal(entry.status, 200);
    assert.equal(entry.level, "info");
    assert.equal(typeof entry.durationMs, "number");
  });
});
