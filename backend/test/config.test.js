
import test from "node:test";
import assert from "node:assert/strict";
import { readBackendEnv } from "../src/config/env.js";

test("backend environment accepts the approved minimum configuration", () => {
  const env = readBackendEnv({
    NODE_ENV: "development",
    PORT: "1702",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    ALLOWED_ORIGIN:
      "http://localhost:5500,http://127.0.0.1:5500"
  });

  assert.equal(env.port, 1702);
  assert.equal(env.supabaseUrl, "https://example.supabase.co");

  assert.deepEqual(env.allowedOrigins, [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ]);
});

test("backend environment accepts production CORS allowlists", () => {
  const env = readBackendEnv({
    NODE_ENV: "production",
    PORT: "10000",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    ALLOWED_ORIGIN: "https://example.vercel.app"
  });

  assert.equal(env.nodeEnv, "production");
  assert.equal(env.port, 10000);

  assert.deepEqual(env.allowedOrigins, [
    "https://example.vercel.app"
  ]);
});

test("backend environment rejects missing Supabase URL or publishable key", () => {
  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_PUBLISHABLE_KEY: "key"
      }),
    /SUPABASE_URL/
  );

  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_URL: "https://example.supabase.co"
      }),
    /SUPABASE_PUBLISHABLE_KEY/
  );
});

test("backend environment rejects malformed ports", () => {
  assert.throws(
    () =>
      readBackendEnv({
        PORT: "70000",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "key"
      }),
    /PORT/
  );

  assert.throws(
    () =>
      readBackendEnv({
        PORT: "invalid",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "key"
      }),
    /PORT/
  );
});

test("backend environment rejects Supabase secret and legacy service-role keys", () => {
  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_secret_not-for-runtime"
      }),
    /never a Supabase secret\/service-role key/
  );

  const payload = Buffer.from(
    JSON.stringify({ role: "service_role" })
  ).toString("base64url");

  const legacyServiceRole = `header.${payload}.signature`;

  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: legacyServiceRole
      }),
    /never a Supabase secret\/service-role key/
  );
});

test("backend environment rejects URL credentials and non-origin CORS entries", () => {
  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_URL: "https://user:pass@example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example"
      }),
    /without embedded credentials/
  );

  assert.throws(
    () =>
      readBackendEnv({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        ALLOWED_ORIGIN: "http://localhost:5500/path"
      }),
    /exact origin/
  );
});
