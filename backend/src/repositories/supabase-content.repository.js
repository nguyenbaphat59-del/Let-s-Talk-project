import { unavailable } from "../errors/api-error.js";

function unwrap(operation, result) {
  if (result?.error) {
    // Do not expose PostgREST/SQL messages to public callers.
    console.error(`[LET'S TALK API] Supabase operation failed: ${operation}`, {
      code: result.error.code || "UNKNOWN"
    });
    throw unavailable();
  }
  return result?.data ?? null;
}

export class SupabaseContentRepository {
  constructor(supabase) {
    if (!supabase || typeof supabase.from !== "function") {
      throw new TypeError("A Supabase client is required.");
    }
    this.supabase = supabase;
  }

  async listActiveTopics() {
    const result = await this.supabase
      .from("topics")
      .select("id, code, name")
      .eq("is_active", true);
    return unwrap("listActiveTopics", result) || [];
  }

  async findActiveTopic(topicCode) {
    const result = await this.supabase
      .from("topics")
      .select("id, code, name")
      .eq("code", topicCode)
      .eq("is_active", true)
      .maybeSingle();
    return unwrap("findActiveTopic", result);
  }

  async listActiveGroups(topicId) {
    const result = await this.supabase
      .from("content_groups")
      .select("id, code, name, display_order")
      .eq("topic_id", topicId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return unwrap("listActiveGroups", result) || [];
  }

  async listAllowedContentTypes(groupIds) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) return [];
    const result = await this.supabase
      .from("content_group_allowed_types")
      .select("content_group_id, content_type")
      .in("content_group_id", groupIds);
    return unwrap("listAllowedContentTypes", result) || [];
  }

  async listActiveContentItems(groupIds) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) return [];
    const result = await this.supabase
      .from("content_items")
      .select("id, content_group_id, content_type, content_text")
      .in("content_group_id", groupIds)
      .eq("is_active", true);
    return unwrap("listActiveContentItems", result) || [];
  }
}
