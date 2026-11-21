import { GameplayService } from "../src/services/gameplay.service.js";
import { POOL_DEFINITIONS } from "../src/services/content-catalog.service.js";

export const uuid = (number) => {
  const tail = number.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${tail}`;
};

export function makeRepository(counts = {}) {
  const groupRows = [];
  const itemRows = [];
  let nextId = 1;

  for (const [poolCode, definition] of Object.entries(POOL_DEFINITIONS)) {
    let group = groupRows.find((row) => row.code === definition.groupCode);
    if (!group) {
      group = {
        id: `group-${definition.groupCode}`,
        code: definition.groupCode,
        name: definition.groupCode,
        display_order: groupRows.length + 1
      };
      groupRows.push(group);
    }

    const amount = counts[poolCode] ?? (Object.keys(counts).length ? 0 : 1);
    for (let index = 0; index < amount; index += 1) {
      itemRows.push({
        id: uuid(nextId++),
        content_group_id: group.id,
        content_type: definition.contentType,
        content_text: `${poolCode} prompt ${index + 1}`
      });
    }
  }

  const familyGroupRows = groupRows.map((row) => ({ ...row, id: `family-${row.id}` }));
  const allowedTypes = [];
  for (const group of [...groupRows, ...familyGroupRows]) {
    const types = group.code === "pick_a_player" ? ["question", "challenge"]
      : ["challenge", "double_challenge"].includes(group.code) ? ["challenge"]
      : ["question"];
    for (const contentType of types) allowedTypes.push({ content_group_id: group.id, content_type: contentType });
  }

  return {
    allowedTypes,
    topics: [
      { id: "topic-friends", code: "friends", name: "Friends" },
      { id: "topic-family", code: "family", name: "Family" }
    ],
    groups: {
      friends: groupRows,
      family: familyGroupRows
    },
    items: {
      friends: itemRows,
      family: itemRows.map((row, index) => ({
        ...row,
        id: uuid(10000 + index),
        content_group_id: `family-${row.content_group_id}`
      }))
    }
  };
}

export function makeService(options = {}) {
  const repository = makeRepository(options.counts || {});
  const repo = {
    listActiveTopics: async () => repository.topics,
    findActiveTopic: async (code) => repository.topics.find((topic) => topic.code === code) || null,
    listActiveGroups: async (topicId) => {
      const topicCode = topicId === "topic-friends" ? "friends" : "family";
      return repository.groups[topicCode];
    },
    listAllowedContentTypes: async (groupIds) => {
      const groupCodes = new Set(
        [...repository.groups.friends, ...repository.groups.family]
          .filter((group) => groupIds.includes(group.id))
          .map((group) => group.code)
      );
      return repository.allowedTypes.filter((row) => {
        const group = [...repository.groups.friends, ...repository.groups.family]
          .find((item) => item.id === row.content_group_id);
        return group && groupCodes.has(group.code) && groupIds.includes(row.content_group_id);
      });
    },
    listActiveContentItems: async (groupIds) => {
      const topicCode = groupIds.some((id) => String(id).startsWith("family-")) ? "family" : "friends";
      return repository.items[topicCode].filter((row) => groupIds.includes(row.content_group_id));
    }
  };
  const randomInt = options.randomInt || ((max) => 0);
  const service = new GameplayService(repo, { randomInt });
  return { service, repository };
}
