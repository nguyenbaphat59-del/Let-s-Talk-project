
import cors from "cors";

export function createCorsMiddleware({
  nodeEnv,
  allowedOrigins = []
}) {
  const allowlist = new Set(allowedOrigins);

  return cors({
    origin(origin, callback) {
      // Allow requests without an Origin header,
      // such as server-to-server requests and health checks.
      if (!origin) {
        return callback(null, true);
      }

      // Allow only explicitly configured origins,
      // including in production.
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

    exposedHeaders: ["X-Request-Id"],

    credentials: false,

    maxAge: 600
  });
}
