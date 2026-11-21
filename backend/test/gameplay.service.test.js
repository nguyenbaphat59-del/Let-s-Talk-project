import test from "node:test";
import assert from "node:assert/strict";
import { makeService, uuid } from "./helpers.js";

test("catalog returns all nine pool counts for Friends", async () => {
  const { service } = makeService({
    counts: {
      question_zone: 3, truth: 2, challenge: 4, double_challenge: 5,
      everyone_answers: 6, surprise_question: 7,
      pick_a_player_question: 8, pick_a_player_challenge: 9, hot_seat: 10
    }
  });
  const catalog = await service.getCatalog("friends");
  assert.equal(catalog.topic.code, "friends");
  assert.equal(Object.keys(catalog.pools).length, 9);
  assert.equal(catalog.pools.question_zone.available, 3);
  assert.equal(catalog.pools.pick_a_player_challenge.available, 9);
});

test("topics are constrained to Friends and Family", async () => {
  const { service } = makeService();
  const result = await service.listTopics();
  assert.deepEqual(result.topics.map((topic) => topic.code), ["friends", "family"]);
  assert.deepEqual(result.sessionLengths, [10, 20, "unlimited"]);
  await assert.rejects(service.getCatalog("love"), (error) => error.code === "INVALID_TOPIC");
});

test("Question Zone is selected when it is the only eligible automatic family", async () => {
  const { service } = makeService({
    counts: { question_zone: 2 },
    randomInt: () => 0
  });
  const result = await service.nextActivity({
    topicCode: "friends",
    trigger: "automatic",
    usedContentIdsByPool: {}
  });
  assert.equal(result.activityFamily, "question_zone");
  assert.equal(result.usedPool, "question_zone");
  assert.equal(result.content.contentType, "question");
});

test("Hot Seat is selected automatically when it is the only eligible main family", async () => {
  const { service } = makeService({
    counts: { hot_seat: 1 },
    randomInt: () => 0
  });
  const result = await service.nextActivity({
    topicCode: "friends",
    trigger: "automatic",
    usedContentIdsByPool: {}
  });
  assert.equal(result.activityFamily, "hot_seat");
  assert.equal(result.usedPool, "hot_seat");
  assert.equal(result.trigger, "automatic");
  assert.match(result.participantInstruction, /group chooses/i);

  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "hot_seat_manual",
      usedContentIdsByPool: {}
    }),
    (error) => error.code === "VALIDATION_ERROR"
  );
});

test("Hot Seat is excluded from random candidates after its pool is exhausted", async () => {
  const { service, repository } = makeService({
    counts: { question_zone: 1, hot_seat: 1 },
    randomInt: () => 0
  });
  const hotSeatId = repository.items.friends.find((item) =>
    item.content_group_id === "group-hot_seat"
  ).id;
  const result = await service.nextActivity({
    topicCode: "friends",
    trigger: "automatic",
    usedContentIdsByPool: { hot_seat: [hotSeatId] }
  });
  assert.equal(result.activityFamily, "question_zone");
  assert.equal(result.usedPool, "question_zone");
});

test("Double Challenge returns two distinct items and one pool code", async () => {
  const { service } = makeService({
    counts: { double_challenge: 2 },
    randomInt: () => 0
  });
  const result = await service.nextActivity({
    topicCode: "friends",
    trigger: "automatic",
    usedContentIdsByPool: {}
  });
  assert.equal(result.eventCode, "double_challenge");
  assert.equal(result.content.length, 2);
  assert.notEqual(result.content[0].id, result.content[1].id);
  assert.equal(result.usedPool, "double_challenge");
});

test("Pick a Player chooses the content type 50/50 and delegates participant choice to group", async () => {
  for (const [expectedType, typeIndex] of [["question", 0], ["challenge", 1]]) {
    const { service } = makeService({
      counts: { pick_a_player_question: 1, pick_a_player_challenge: 1 },
      randomInt: (max) => max === 2 ? typeIndex : 0
    });
    const result = await service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: {}
    });
    assert.equal(result.eventCode, "pick_a_player");
    assert.equal(result.selectedContentType, expectedType);
    assert.equal(result.content.contentType, expectedType);
    assert.match(result.participantInstruction, /group chooses/i);
  }
});

test("Mystery resolves to either Truth or Challenge using injected secure-random seam", async () => {
  for (const [expected, index] of [["truth", 0], ["challenge", 1]]) {
    const { service } = makeService({
      counts: { truth: 1, challenge: 1 },
      randomInt: (max) => max === 2 ? index : 0
    });
    const result = await service.resolveFate({
      topicCode: "friends",
      choice: "mystery",
      usedContentIdsByPool: {}
    });
    assert.equal(result.resolvedChoice, expected);
    assert.equal(result.usedPool, expected);
  }
});

test("Mystery is rejected when either dedicated pool is empty", async () => {
  const { service } = makeService({ counts: { truth: 1 } });
  await assert.rejects(
    service.resolveFate({
      topicCode: "friends",
      choice: "mystery",
      usedContentIdsByPool: {}
    }),
    (error) => error.code === "CONTENT_POOL_EXHAUSTED"
  );
});

test("used IDs from another pool are rejected", async () => {
  const { service, repository } = makeService({ counts: { question_zone: 1 } });
  const qzId = repository.items.friends[0].id;
  await assert.rejects(
    service.nextQuestionZone({
      topicCode: "friends",
      usedContentIdsByPool: { truth: [qzId] }
    }),
    (error) => error.code === "INVALID_USED_IDS"
  );
});

test("duplicate IDs across pools are rejected", async () => {
  const { service, repository } = makeService({ counts: { question_zone: 1 } });
  const qzId = repository.items.friends[0].id;
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: { question_zone: [qzId], truth: [qzId] }
    }),
    (error) => error.code === "INVALID_USED_IDS"
  );
});

test("exhausted pools are not reused or silently substituted", async () => {
  const { service, repository } = makeService({
    counts: { question_zone: 1 }
  });
  const onlyId = repository.items.friends[0].id;
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: { question_zone: [onlyId] }
    }),
    (error) => error.code === "NO_ELIGIBLE_ACTIVITY" &&
      error.details === undefined
  );
});

test("Next Question returns a fresh QZ prompt and rejects exhaustion", async () => {
  const { service, repository } = makeService({ counts: { question_zone: 2 } });
  const first = repository.items.friends[0].id;
  const result = await service.nextQuestionZone({
    topicCode: "friends",
    usedContentIdsByPool: { question_zone: [first] }
  });
  assert.notEqual(result.content.id, first);
  await assert.rejects(
    service.nextQuestionZone({
      topicCode: "friends",
      usedContentIdsByPool: { question_zone: [first, result.content.id] }
    }),
    (error) => error.code === "CONTENT_POOL_EXHAUSTED"
  );
});

test("request validation rejects unknown pool keys and malformed UUIDs", async () => {
  const { service } = makeService();
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: { mystery: [] }
    }),
    (error) => error.code === "INVALID_USED_IDS"
  );
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: { question_zone: ["not-a-uuid"] }
    }),
    (error) => error.code === "INVALID_USED_IDS"
  );
});

test("Double Challenge is not eligible with only one item", async () => {
  const { service } = makeService({ counts: { double_challenge: 1 } });
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: {}
    }),
    (error) => error.code === "NO_ELIGIBLE_ACTIVITY"
  );
});

test("Pick a Player is not eligible unless both type pools remain available", async () => {
  const { service } = makeService({
    counts: { pick_a_player_question: 1 }
  });
  await assert.rejects(
    service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: {}
    }),
    (error) => error.code === "NO_ELIGIBLE_ACTIVITY"
  );
});


test("automatic main-family selection is approximately uniform across all four eligible families", async () => {
  let state = 0x12345678;
  const pseudoRandomInt = (max) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % max;
  };
  const { service } = makeService({
    counts: {
      question_zone: 10, truth: 10, challenge: 10, double_challenge: 10,
      everyone_answers: 10, surprise_question: 10,
      pick_a_player_question: 10, pick_a_player_challenge: 10, hot_seat: 10
    },
    randomInt: pseudoRandomInt
  });
  const counts = { question_zone: 0, pick_your_fate: 0, random_event: 0, hot_seat: 0 };
  for (let index = 0; index < 6000; index += 1) {
    const result = await service.nextActivity({
      topicCode: "friends",
      trigger: "automatic",
      usedContentIdsByPool: {}
    });
    counts[result.activityFamily] += 1;
  }
  for (const amount of Object.values(counts)) {
    assert.ok(amount > 1300 && amount < 1700, `family frequency outside 21.7%–28.3% tolerance: ${amount}`);
  }
});


test("catalog rejects incomplete or unexpected allowed content-type mappings", async () => {
  const { service, repository } = makeService();
  repository.allowedTypes = repository.allowedTypes.filter((row) =>
    !(row.content_group_id === "group-pick_a_player" && row.content_type === "challenge")
  );
  await assert.rejects(
    service.getCatalog("friends"),
    (error) => error.status === 503
  );
});
