
import cors from "cors";

export function createCorsMiddleware({
  nodeEnv,
  allowedOrigins = []
}) {
  const allowlist = new Set(
    allowedOrigins.map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value;
      }
    })
  );

  return cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      let normalizedOrigin;

      try {
        normalizedOrigin = new URL(origin).origin;
      } catch {
        console.error("[CORS] Invalid request origin:", origin);
        return callback(null, false);
      }

      const allowed = allowlist.has(normalizedOrigin);

      console.log("[CORS] Request:", {
        origin: normalizedOrigin,
        allowed,
        nodeEnv
      });

      if (allowed) {
        return callback(null, true);
      }

      console.warn("[CORS] Blocked origin:", normalizedOrigin);
      return callback(null, false);
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "X-Request-Id"
    ],

    exposedHeaders: ["X-Request-Id"],

    credentials: false,

    maxAge: 600
  });
}
