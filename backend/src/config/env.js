
function parseHttpUrl(value, fieldName) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid HTTP(S) URL.`);
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      `${fieldName} must be a valid HTTP(S) URL without embedded credentials.`
    );
  }

  return parsed;
}

function isElevatedSupabaseKey(key) {
  if (key.startsWith("sb_secret_")) return true;

  const parts = key.split(".");

  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function readBackendEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV || "development";
  const port = Number(source.PORT || 1702);

  const supabaseUrl = String(source.SUPABASE_URL || "").trim();
  const publishableKey = String(
    source.SUPABASE_PUBLISHABLE_KEY || ""
  ).trim();

  const sentryDsn = String(source.SENTRY_DSN || "").trim();

  const allowedOrigins = String(source.ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  // Validate port
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  // Validate Supabase URL
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL is required and must be a valid HTTP(S) URL."
    );
  }

  parseHttpUrl(supabaseUrl, "SUPABASE_URL");

  // Validate Supabase publishable key
  if (!publishableKey) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY is required.");
  }

  if (isElevatedSupabaseKey(publishableKey)) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY must be a publishable/anon-scoped key, never a Supabase secret/service-role key."
    );
  }

  // Validate exact CORS origins
  for (const origin of allowedOrigins) {
    const parsedOrigin = parseHttpUrl(origin, "ALLOWED_ORIGIN");

    if (
      parsedOrigin.origin !== origin ||
      parsedOrigin.pathname !== "/" ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      throw new Error(
        "Each ALLOWED_ORIGIN entry must contain only an exact origin (scheme, host and optional port)."
      );
    }
  }

  // Validate optional Sentry DSN (error monitoring is disabled when empty)
  // (a DSN embeds its public key as the URL username, so parseHttpUrl is not used here)
  if (sentryDsn) {
    let parsedDsn;
    try {
      parsedDsn = new URL(sentryDsn);
    } catch {
      parsedDsn = null;
    }
    if (!parsedDsn || parsedDsn.protocol !== "https:" || !parsedDsn.username ||
        parsedDsn.password || !/^\/\d+$/.test(parsedDsn.pathname)) {
      throw new Error("SENTRY_DSN must be a Sentry DSN such as https://<publicKey>@o0.ingest.sentry.io/<projectId>.");
    }
  }

  return Object.freeze({
    nodeEnv,
    port,
    supabaseUrl,
    publishableKey,
    allowedOrigins,
    sentryDsn
  });
}
