import { ApiError } from "../errors/api-error.js";

export function notFoundMiddleware(req, res, next) {
  const error = new ApiError(404, "ROUTE_NOT_FOUND", "The requested API route was not found.");
  next(error);
}

/**
 * Creates the centralized error handler.
 * @param {(error: unknown, context: object) => void} [reportError]
 *   Optional reporter (e.g. Sentry) called for unexpected failures (HTTP 500)
 *   and for ApiErrors with status >= 500. It must never throw.
 */
export function createErrorMiddleware(reportError = () => {}) {
  return function errorMiddlewareWithReporter(error, req, res, next) {
    if (!res.headersSent && (!(error instanceof ApiError) || error.status >= 500) &&
        error?.type !== "entity.too.large" && error?.type !== "entity.parse.failed") {
      try {
        reportError(error, {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl
        });
      } catch {
        // Monitoring must never break the API response.
      }
    }
    return errorMiddleware(error, req, res, next);
  };
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  let normalized = error;
  if (error?.type === "entity.too.large") {
    normalized = new ApiError(413, "PAYLOAD_TOO_LARGE", "The request body exceeds the 128 KB limit.");
  } else if (error?.type === "entity.parse.failed") {
    normalized = new ApiError(400, "VALIDATION_ERROR", "The request body must contain valid JSON.");
  } else if (!(error instanceof ApiError)) {
    console.error("[LET'S TALK API] Unexpected request failure.", {
      requestId: req.requestId,
      name: error?.name || "Error"
    });
    normalized = new ApiError(500, "INTERNAL_ERROR", "An unexpected server error occurred.");
  }

  const payload = {
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details === undefined ? {} : { details: normalized.details }),
      requestId: req.requestId
    }
  };
  res.status(normalized.status).json(payload);
}
