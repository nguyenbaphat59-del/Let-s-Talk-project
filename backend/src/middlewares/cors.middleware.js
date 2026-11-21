
import cors from "cors";

export function createCorsMiddleware({ allowedOrigins = [] } = {}) {
  const allowlist = new Set(allowedOrigins);

  return cors({
    origin(origin, callback) {
      // Allow requests without an Origin header.
      // Examples: server-to-server requests and command-line tools.
      if (!origin) {
        return callback(null, true);
      }

      // Allow requests only from explicitly configured origins.
      // This applies to both development and production.
      if (allowlist.has(origin)) {
        return callback(null, true);
      }

      // Reject unapproved cross-origin requests.
      return callback(null, false);
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "X-Request-Id"
    ],

    exposedHeaders: [
      "X-Request-Id"
    ],

    credentials: false,

    maxAge: 600
  });
}
