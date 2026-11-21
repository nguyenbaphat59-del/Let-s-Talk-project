/**
 * Backend error monitoring (Sentry). Optional: when SENTRY_DSN is not set the
 * Sentry SDK is not even loaded and the returned reporter only logs locally.
 *
 * The reporter is passed to createApp({ reportError }) and is called by the
 * centralized error middleware for unexpected failures (HTTP 5xx). Each event
 * carries the requestId, HTTP method and path, which are also present in the
 * structured access log and in the API error envelope returned to the client.
 */
export async function initMonitoring({ dsn, environment, release, logger = console } = {}) {
  const logLocally = (error, context = {}) => {
    logger.error(JSON.stringify({
      time: new Date().toISOString(),
      level: "error",
      message: "Unexpected request failure",
      errorName: error?.name || "Error",
      errorMessage: error?.message,
      ...context
    }));
  };

  if (!dsn) {
    return { enabled: false, reportError: logLocally, flush: async () => true };
  }

  const Sentry = await import("@sentry/node");
  Sentry.init({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    tracesSampleRate: 0
  });

  const reportError = (error, context = {}) => {
    logLocally(error, context);
    Sentry.withScope((scope) => {
      if (context.requestId) scope.setTag("request_id", context.requestId);
      if (context.method) scope.setTag("http.method", context.method);
      if (context.path) scope.setTag("http.path", context.path);
      scope.setContext("request", context);
      Sentry.captureException(error);
    });
  };

  return { enabled: true, reportError, flush: (timeout = 2000) => Sentry.flush(timeout) };
}
