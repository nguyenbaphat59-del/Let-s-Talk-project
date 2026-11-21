/**
 * Structured access log: one JSON line per API request.
 * Fields: time, level, requestId, method, path, status, durationMs.
 * The requestId is also returned in the X-Request-Id header and in every error
 * envelope, so a Frontend/Sentry error can be matched to this server log line.
 * Request bodies (used content IDs) and headers are intentionally not logged.
 */
export function createRequestLoggerMiddleware(logger = console) {
  return function requestLogger(req, res, next) {
    const started = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number((process.hrtime.bigint() - started) / 1000000n);
      const entry = {
        time: new Date().toISOString(),
        level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        durationMs
      };
      const write = logger[entry.level] || logger.log;
      write.call(logger, JSON.stringify(entry));
    });
    next();
  };
}
