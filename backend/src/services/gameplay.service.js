import { randomInt as secureRandomInt } from "node:crypto";
import { ApiError, badRequest, conflict } from "../errors/api-error.js";
import { ContentCatalogService, POOL_KEYS } from "./content-catalog.service.js";
import { pickDistinct, pickOne } from "../utils/random.js";

const EVENT_POOLS = Object.freeze({
  double_challenge: "double_challenge",
  everyone_answers: "everyone_answers",
  surprise_question: "surprise_question",
  pick_a_player: null
});

function assertObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`${field} must be an object.`);
  }
}

function assertAllowedKeys(value, allowed, field) {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length) throw badRequest(`${field} contains unsupported properties.`, "VALIDATION_ERROR", { extra });
}

function assertTopicCode(value) {
  if (!["friends", "family"].includes(value)) {
    throw badRequest("topicCode must be friends or family.", "INVALID_TOPIC");
  }
}

function assertUsedIds(value) {
  assertObject(value, "usedContentIdsByPool");
}

export class GameplayService {
  constructor(repository, options = {}) {
    this.catalog = options.catalogService || new ContentCatalogService(repository);
    this.randomInt = options.randomInt || secureRandomInt;
  }

  async listTopics() {
    return {
      topics: await this.catalog.listTopics(),
      sessionLengths: [10, 20, "unlimited"]
    };
  }

  async getCatalog(topicCode) {
    return this.catalog.getCatalog(topicCode);
  }

  #contextAndUsed = async (topicCode, usedContentIdsByPool) => {
    const context = await this.catalog.loadTopicContext(topicCode);
    const used = this.catalog.validateUsedContentIds(usedContentIdsByPool, context);
    return { context, used };
  };

  #choose(items) {
    return pickOne(items, this.randomInt);
  }

  #content(item) {
    return { id: item.id, contentType: item.contentType, text: item.text };
  }

  #selectSingle(item, activityFamily, usedPool, extra = {}) {
    return {
      activityFamily,
      content: this.#content(item),
      usedPool,
      ...extra
    };
  }

  async nextActivity(body) {
    assertObject(body, "Request body");
    assertAllowedKeys(body, ["topicCode", "trigger", "usedContentIdsByPool"], "Request body");
    assertTopicCode(body.topicCode);
    if (body.trigger !== "automatic") {
      throw badRequest("trigger must be automatic.");
    }
    assertUsedIds(body.usedContentIdsByPool);
    const { context, used } = await this.#contextAndUsed(body.topicCode, body.usedContentIdsByPool);

    const candidateFamilies = [];
    const questionZone = this.catalog.getUnused(context, used, "question_zone");
    const truths = this.catalog.getUnused(context, used, "truth");
    const challenges = this.catalog.getUnused(context, used, "challenge");
    const events = this.#eligibleEvents(context, used);
    const hotSeat = this.catalog.getUnused(context, used, "hot_seat");

    if (questionZone.length) candidateFamilies.push("question_zone");
    if (truths.length || challenges.length) candidateFamilies.push("pick_your_fate");
    if (events.length) candidateFamilies.push("random_event");
    if (hotSeat.length) candidateFamilies.push("hot_seat");

    if (!candidateFamilies.length) {
      throw conflict(
        "No eligible activities remain in this session.",
        "NO_ELIGIBLE_ACTIVITY"
      );
    }

    const family = this.#choose(candidateFamilies);

    if (family === "hot_seat") {
      return this.#selectSingle(
        this.#choose(hotSeat),
        "hot_seat",
        "hot_seat",
        {
          trigger: "automatic",
          participantInstruction: "The group chooses who takes the Hot Seat. The participant may pass."
        }
      );
    }

    if (family === "question_zone") {
      return this.#selectSingle(this.#choose(questionZone), family, "question_zone");
    }

    if (family === "pick_your_fate") {
      return {
        activityFamily: family,
        requiresChoice: true,
        choices: {
          truth: {
            enabled: truths.length > 0,
            ...(truths.length ? {} : { reason: "No unused Truth questions remain." })
          },
          challenge: {
            enabled: challenges.length > 0,
            ...(challenges.length ? {} : { reason: "No unused Challenges remain." })
          },
          mystery: {
            enabled: truths.length > 0 && challenges.length > 0,
            ...(truths.length && challenges.length ? { probability: "50/50" } : {
              reason: "Mystery requires at least one unused Truth and one unused Challenge."
            })
          }
        }
      };
    }

    const eventCode = this.#choose(events);
    if (eventCode === "double_challenge") {
      const two = pickDistinct(
        this.catalog.getUnused(context, used, "double_challenge"),
        2,
        this.randomInt
      );
      return {
        activityFamily: "random_event",
        eventCode,
        content: two.map((item) => this.#content(item)),
        usedPool: "double_challenge"
      };
    }

    if (eventCode === "pick_a_player") {
      const questionPool = this.catalog.getUnused(context, used, "pick_a_player_question");
      const challengePool = this.catalog.getUnused(context, used, "pick_a_player_challenge");
      const selectedContentType = this.#choose(["question", "challenge"]);
      const poolCode = selectedContentType === "question"
        ? "pick_a_player_question"
        : "pick_a_player_challenge";
      const selected = selectedContentType === "question" ? questionPool : challengePool;
      return this.#selectSingle(
        this.#choose(selected),
        "random_event",
        poolCode,
        {
          eventCode,
          selectedContentType,
          participantInstruction: "The group chooses who answers or performs the challenge. The app does not choose a person."
        }
      );
    }

    const poolCode = EVENT_POOLS[eventCode];
    return this.#selectSingle(
      this.#choose(this.catalog.getUnused(context, used, poolCode)),
      "random_event",
      poolCode,
      { eventCode }
    );
  }

  #eligibleEvents(context, used) {
    const available = (pool) => this.catalog.getUnused(context, used, pool).length;
    const events = [];
    if (available("double_challenge") >= 2) events.push("double_challenge");
    if (available("everyone_answers") > 0) events.push("everyone_answers");
    if (available("surprise_question") > 0) events.push("surprise_question");
    if (available("pick_a_player_question") > 0 && available("pick_a_player_challenge") > 0) {
      events.push("pick_a_player");
    }
    return events;
  }

  async resolveFate(body) {
    assertObject(body, "Request body");
    assertAllowedKeys(body, ["topicCode", "choice", "usedContentIdsByPool"], "Request body");
    assertTopicCode(body.topicCode);
    if (!["truth", "challenge", "mystery"].includes(body.choice)) {
      throw badRequest("choice must be truth, challenge or mystery.");
    }
    assertUsedIds(body.usedContentIdsByPool);
    const { context, used } = await this.#contextAndUsed(body.topicCode, body.usedContentIdsByPool);

    const truthPool = this.catalog.getUnused(context, used, "truth");
    const challengePool = this.catalog.getUnused(context, used, "challenge");
    let resolvedChoice = body.choice;

    if (resolvedChoice === "mystery") {
      if (!truthPool.length || !challengePool.length) {
        throw conflict(
          "Mystery requires at least one unused Truth and one unused Challenge.",
          "CONTENT_POOL_EXHAUSTED",
          { topicCode: body.topicCode, poolCode: "mystery" }
        );
      }
      resolvedChoice = this.#choose(["truth", "challenge"]);
    }

    const poolCode = resolvedChoice;
    const selectedPool = resolvedChoice === "truth" ? truthPool : challengePool;
    if (!selectedPool.length) {
      throw conflict(
        `No unused ${resolvedChoice === "truth" ? "Truth questions" : "Challenges"} remain.`,
        "CONTENT_POOL_EXHAUSTED",
        { topicCode: body.topicCode, poolCode }
      );
    }

    return this.#selectSingle(
      this.#choose(selectedPool),
      "pick_your_fate",
      poolCode,
      { resolvedChoice }
    );
  }

  async nextQuestionZone(body) {
    assertObject(body, "Request body");
    assertAllowedKeys(body, ["topicCode", "usedContentIdsByPool"], "Request body");
    assertTopicCode(body.topicCode);
    assertUsedIds(body.usedContentIdsByPool);
    const { context, used } = await this.#contextAndUsed(body.topicCode, body.usedContentIdsByPool);
    const items = this.catalog.getUnused(context, used, "question_zone");
    if (!items.length) {
      throw conflict(
        "No unused questions remain in the Question Zone.",
        "CONTENT_POOL_EXHAUSTED",
        { topicCode: body.topicCode, poolCode: "question_zone" }
      );
    }
    return this.#selectSingle(this.#choose(items), "question_zone", "question_zone");
  }
}
