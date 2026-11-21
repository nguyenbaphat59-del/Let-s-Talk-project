import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { makeService } from "./helpers.js";

async function withServer(callback, counts = { question_zone: 2 }) {
  const { service } = makeService({ counts });
  const app = createApp({ gameplayService: service, nodeEnv: "test" });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("GET health returns standard success envelope and request ID", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.status, "ok");
    assert.match(body.meta.requestId, /^[0-9a-f-]{36}$/i);
    assert.equal(response.headers.get("x-request-id"), body.meta.requestId);
  });
});

test("GET topics returns the approved topic and session choices", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/topics`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.data.topics.map((topic) => topic.code), ["friends", "family"]);
    assert.deepEqual(body.data.sessionLengths, [10, 20, "unlimited"]);
  });
});

test("GET catalog returns live pool counts shape", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/topics/friends/catalog`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.topic.code, "friends");
    assert.equal(Object.keys(body.data.pools).length, 9);
    assert.equal(body.data.pools.question_zone.available, 2);
  });
});

test("POST invalid gameplay body returns standard 400 error envelope", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/gameplay/next-activity`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topicCode: "friends", trigger: "surprise" })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.match(body.error.requestId, /^[0-9a-f-]{36}$/i);
    assert.equal("stack" in body.error, false);
  });
});

test("Unknown API route returns standardized 404", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/not-a-route`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.error.code, "ROUTE_NOT_FOUND");
  });
});

test("Oversized JSON payload returns 413", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/gameplay/next-activity`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(140_000) })
    });
    const body = await response.json();
    assert.equal(response.status, 413);
    assert.equal(body.error.code, "PAYLOAD_TOO_LARGE");
  });
});


test("POST next-activity can automatically select Hot Seat as the only eligible family", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/gameplay/next-activity`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topicCode: "friends",
        trigger: "automatic",
        usedContentIdsByPool: {}
      })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.activityFamily, "hot_seat");
    assert.equal(body.data.trigger, "automatic");
    assert.equal(body.data.usedPool, "hot_seat");
    assert.equal(body.data.content.contentType, "question");
    assert.match(body.data.participantInstruction, /group chooses/i);
  }, { hot_seat: 1 });
});

test("POST next-activity rejects the retired manual Hot Seat trigger", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/gameplay/next-activity`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topicCode: "friends",
        trigger: "hot_seat_manual",
        usedContentIdsByPool: {}
      })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});
