import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { createCorsMiddleware } from "./middlewares/cors.middleware.js";
import { createErrorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
import { createRequestLoggerMiddleware } from "./middlewares/request-logger.middleware.js";
import { createApiRouter } from "./routes/api.routes.js";

export function createApp({
  gameplayService,
  nodeEnv = "test",
  allowedOrigins = [],
  logger = console,
  reportError = () => {},
  requestLogging = nodeEnv !== "test"
} = {}) {
  if (!gameplayService) throw new TypeError("gameplayService is required.");

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", nodeEnv === "production" ? 1 : false);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" }
  }));
  app.use(createCorsMiddleware({ nodeEnv, allowedOrigins }));
  app.use(requestIdMiddleware);
  if (requestLogging) app.use(createRequestLoggerMiddleware(logger));
  app.use(express.json({ limit: "128kb", strict: true }));

  const gameplayLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many gameplay requests. Please wait and try again."
      }
    },
    handler(req, res) {
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many gameplay requests. Please wait and try again.",
          requestId: req.requestId
        }
      });
    }
  });

  app.use("/api/v1/gameplay", gameplayLimiter);
  app.use("/api/v1", createApiRouter(gameplayService));
  app.use("/api/v1", notFoundMiddleware);
  app.use(createErrorMiddleware(reportError));

  app.locals.logger = logger;
  return app;
}
