export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message, code = "VALIDATION_ERROR", details) {
  return new ApiError(400, code, message, details);
}

export function conflict(message, code = "INVALID_ACTIVITY_STATE", details) {
  return new ApiError(409, code, message, details);
}

export function notFound(message, code = "ROUTE_NOT_FOUND", details) {
  return new ApiError(404, code, message, details);
}

export function unavailable(message = "The content service is temporarily unavailable.") {
  return new ApiError(503, "CONTENT_SERVICE_UNAVAILABLE", message);
}
