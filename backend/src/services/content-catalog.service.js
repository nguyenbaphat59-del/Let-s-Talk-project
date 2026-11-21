import { badRequest, notFound, unavailable } from "../errors/api-error.js";

export const TOPIC_CODES = Object.freeze(["friends", "family"]);

export const POOL_DEFINITIONS = Object.freeze({
  question_zone: Object.freeze({ groupCode: "question_zone", contentType: "question" }),
  truth: Object.freeze({ groupCode: "truth", contentType: "question" }),
  challenge: Object.freeze({ groupCode: "challenge", contentType: "challenge" }),
  double_challenge: Object.freeze({ groupCode: "double_challenge", contentType: "challenge" }),
  everyone_answers: Object.freeze({ groupCode: "everyone_answers", contentType: "question" }),
  surprise_question: Object.freeze({ groupCode: "surprise_question", contentType: "question" }),
  pick_a_player_question: Object.freeze({ groupCode: "pick_a_player", contentType: "question" }),
  pick_a_player_challenge: Object.freeze({ groupCode: "pick_a_player", contentType: "challenge" }),
  hot_seat: Object.freeze({ groupCode: "hot_seat", contentType: "question" })
});

export const POOL_KEYS = Object.freeze(Object.keys(POOL_DEFINITIONS));
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ContentCatalogService {
  constructor(repository) {
    if (!repository) throw new TypeError("A content repository is required.");
    this.repository = repository;
  }

  async listTopics() {
    const topics = await this.repository.listActiveTopics();
    const allowed = new Map(topics.map((topic) => [topic.code, topic]));
    return TOPIC_CODES
      .filter((code) => allowed.has(code))
      .map((code) => ({ code, name: allowed.get(code).name }));
  }

  async loadTopicContext(topicCode) {
    if (!TOPIC_CODES.includes(topicCode)) {
      throw badRequest("Please provide a supported topic code.", "INVALID_TOPIC");
    }

    const topic = await this.repository.findActiveTopic(topicCode);
    if (!topic) {
      throw notFound("The requested topic is not available.", "TOPIC_NOT_FOUND", { topicCode });
    }

    const groups = await this.repository.listActiveGroups(topic.id);
    const groupByCode = new Map(groups.map((group) => [group.code, group]));
    const requiredGroupCodes = [...new Set(
      Object.values(POOL_DEFINITIONS).map((definition) => definition.groupCode)
    )];
    const missingGroups = requiredGroupCodes.filter((code) => !groupByCode.has(code));
    if (missingGroups.length > 0) {
      console.error("[LET'S TALK API] Active topic is missing required content groups.", {
        topicCode,
        missingGroups
      });
      throw unavailable("The content catalog is incomplete. Please try again later.");
    }

    const groupIds = [...new Set(groups.map((group) => group.id))];
    const groupCodeByIdForValidation = new Map(groups.map((group) => [group.id, group.code]));
    if (typeof this.repository.listAllowedContentTypes !== "function") {
      console.error("[LET'S TALK API] Repository does not implement allowed content-type validation.");
      throw unavailable("The content catalog configuration is incomplete. Please try again later.");
    }
    const allowedTypeRows = await this.repository.listAllowedContentTypes(groupIds);
    const expectedAllowedPairs = new Set([
      "question_zone:question",
      "truth:question",
      "challenge:challenge",
      "double_challenge:challenge",
      "everyone_answers:question",
      "surprise_question:question",
      "pick_a_player:question",
      "pick_a_player:challenge",
      "hot_seat:question"
    ]);
    const actualAllowedPairs = new Set(allowedTypeRows.map((row) => {
      const groupCode = groupCodeByIdForValidation.get(row.content_group_id);
      return groupCode ? `${groupCode}:${row.content_type}` : `unknown:${row.content_type}`;
    }));
    const missingAllowedPairs = [...expectedAllowedPairs].filter((pair) => !actualAllowedPairs.has(pair));
    const unexpectedAllowedPairs = [...actualAllowedPairs].filter((pair) => !expectedAllowedPairs.has(pair));
    if (missingAllowedPairs.length || unexpectedAllowedPairs.length || actualAllowedPairs.size !== allowedTypeRows.length) {
      console.error("[LET'S TALK API] Active topic has an invalid allowed content-type mapping.", {
        topicCode,
        missingAllowedPairs,
        unexpectedAllowedPairs
      });
      throw unavailable("The content catalog configuration is incomplete. Please try again later.");
    }

    const rows = await this.repository.listActiveContentItems(groupIds);
    const groupCodeById = new Map(groups.map((group) => [group.id, group.code]));
    const poolItems = Object.fromEntries(POOL_KEYS.map((key) => [key, []]));
    const poolById = new Map();

    for (const row of rows) {
      const groupCode = groupCodeById.get(row.content_group_id);
      const matchedPool = Object.entries(POOL_DEFINITIONS).find(([, definition]) =>
        definition.groupCode === groupCode && definition.contentType === row.content_type
      )?.[0];

      if (!matchedPool || !row.id || !String(row.content_text || "").trim()) {
        console.error("[LET'S TALK API] An active content row violates the approved group/type map.", {
          rowId: row.id || null,
          groupCode: groupCode || null
        });
        throw unavailable("The content catalog contains an invalid item.");
      }

      const item = {
        id: row.id,
        contentType: row.content_type,
        text: row.content_text
      };
      poolItems[matchedPool].push(item);
      poolById.set(row.id, matchedPool);
    }

    return {
      topic: { code: topic.code, name: topic.name },
      groups: groupByCode,
      poolItems,
      poolById
    };
  }

  async getCatalog(topicCode) {
    const context = await this.loadTopicContext(topicCode);
    const pools = {};
    for (const key of POOL_KEYS) {
      pools[key] = {
        contentType: POOL_DEFINITIONS[key].contentType,
        available: context.poolItems[key].length
      };
    }
    return { topic: context.topic, pools };
  }

  validateUsedContentIds(input, context) {
    if (input === undefined || input === null || typeof input !== "object" || Array.isArray(input)) {
      throw badRequest("usedContentIdsByPool must be an object.", "INVALID_USED_IDS");
    }

    const unknownKeys = Object.keys(input).filter((key) => !POOL_KEYS.includes(key));
    if (unknownKeys.length > 0) {
      throw badRequest("Unknown used-content pool key.", "INVALID_USED_IDS", { unknownKeys });
    }

    const normalized = Object.fromEntries(POOL_KEYS.map((key) => [
      key,
      input[key] === undefined ? [] : (Array.isArray(input[key]) ? [...input[key]] : input[key])
    ]));
    const seen = new Set();
    let total = 0;

    for (const key of POOL_KEYS) {
      const ids = normalized[key];
      if (!Array.isArray(ids)) {
        throw badRequest("Each used-content pool must be an array.", "INVALID_USED_IDS", { poolCode: key });
      }

      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
          throw badRequest("Every used content ID must be a UUID.", "INVALID_USED_IDS", { poolCode: key });
        }
        const canonicalId = id.toLowerCase();
        ids[index] = canonicalId;
        if (seen.has(canonicalId)) {
          throw badRequest("A content ID cannot appear more than once across pools.", "INVALID_USED_IDS");
        }
        seen.add(canonicalId);
        total += 1;

        if (context.poolById.get(canonicalId) !== key) {
          throw badRequest(
            "A used content ID does not belong to the selected topic and declared pool.",
            "INVALID_USED_IDS",
            { poolCode: key }
          );
        }
      }

      if (ids.length > context.poolItems[key].length) {
        throw badRequest("Used IDs exceed the active size of their content pool.", "INVALID_USED_IDS", {
          poolCode: key
        });
      }
    }

    if (total > 880) {
      throw badRequest("At most 880 unique used content IDs may be supplied.", "INVALID_USED_IDS");
    }

    return normalized;
  }

  getUnused(context, used, poolCode) {
    const usedSet = new Set(used[poolCode]);
    return context.poolItems[poolCode].filter((item) => !usedSet.has(item.id));
  }
}
