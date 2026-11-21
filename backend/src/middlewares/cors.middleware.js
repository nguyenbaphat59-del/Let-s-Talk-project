import cors from "cors";

export function createCorsMiddleware({ nodeEnv, allowedOrigins = [] }) {
  const allowlist = new Set(allowedOrigins);
  return cors({
    origin(origin, callback) {
      // Requests without Origin (same-origin/server-to-server) are allowed.
      if (!origin || (nodeEnv !== "production" && allowlist.has(origin))) {
        return callback(null, true);
      }
      // No ACAO header: the browser rejects unapproved cross-origin access.
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    credentials: false,
    maxAge: 600
  });
}
