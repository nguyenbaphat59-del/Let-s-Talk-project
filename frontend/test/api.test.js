import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(projectRoot, 'frontend/js/api.js'), 'utf8');

function createClient({ location, overrideBase, fetchImpl }) {
  const window = { location };
  if (overrideBase) window.LT_API_BASE_URL = overrideBase;
  vm.runInNewContext(source, { window, URL, fetch: fetchImpl, Object, String, Error }, { filename: 'frontend/js/api.js' });
  return window.LTAPI;
}

test('API client uses the local Backend port when Frontend runs on port 5500', () => {
  const api = createClient({
    location: { protocol: 'http:', port: '5500', origin: 'http://localhost:5500' },
    fetchImpl: async () => { throw new Error('not expected'); }
  });
  assert.equal(api.baseUrl, 'http://localhost:1702/api/v1');
});

test('API client uses the relative same-origin base in production', () => {
  const api = createClient({
    location: { protocol: 'https:', port: '', origin: 'https://lets-talk.example' },
    fetchImpl: async () => { throw new Error('not expected'); }
  });
  assert.equal(api.baseUrl, '/api/v1');
});

test('API client supports an explicit API base URL override', () => {
  const api = createClient({
    location: { protocol: 'http:', port: '5501', origin: 'http://localhost:5501' },
    overrideBase: 'http://127.0.0.1:1702/api/v1/',
    fetchImpl: async () => { throw new Error('not expected'); }
  });
  assert.equal(api.baseUrl, 'http://127.0.0.1:1702/api/v1');
});

test('API client encodes topic path and returns the standard data envelope', async () => {
  let requestUrl = '';
  const api = createClient({
    location: { protocol: 'https:', port: '', origin: 'https://lets-talk.example' },
    fetchImpl: async (url) => {
      requestUrl = url;
      return { ok: true, status: 200, json: async () => ({ data: { topic: { code: 'friends' } }, meta: { requestId: 'r1' } }) };
    }
  });
  const result = await api.getCatalog('friends');
  assert.equal(requestUrl, '/api/v1/topics/friends/catalog');
  assert.equal(result.topic.code, 'friends');
});

test('API client converts standardized API errors to typed ApiError', async () => {
  const api = createClient({
    location: { protocol: 'https:', port: '', origin: 'https://lets-talk.example' },
    fetchImpl: async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: 'CONTENT_POOL_EXHAUSTED', message: 'No unused prompts remain.', details: { poolCode: 'truth' }, requestId: 'r2' } })
    })
  });
  await assert.rejects(api.nextActivity({}), (error) =>
    error.name === 'ApiError' && error.status === 409 &&
    error.code === 'CONTENT_POOL_EXHAUSTED' && error.details.poolCode === 'truth' && error.requestId === 'r2'
  );
});

test('API client turns network failures and malformed payloads into actionable errors', async () => {
  const networkApi = createClient({
    location: { protocol: 'https:', port: '', origin: 'https://lets-talk.example' },
    fetchImpl: async () => { throw new Error('offline'); }
  });
  await assert.rejects(networkApi.getHealth(), (error) => error.code === 'NETWORK_ERROR');

  const malformedApi = createClient({
    location: { protocol: 'https:', port: '', origin: 'https://lets-talk.example' },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) })
  });
  await assert.rejects(malformedApi.getHealth(), (error) => error.code === 'INVALID_API_RESPONSE');
});
