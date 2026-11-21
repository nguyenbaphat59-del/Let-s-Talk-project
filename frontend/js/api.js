
/* LET'S TALK — Frontend API client */
(() => {
  'use strict';

  // Production Backend hosted on Render.
  const PRODUCTION_API_BASE =
    'https://let-s-talk-backend-lk1u.onrender.com/api/v1';

  // Local Backend configuration.
  const LOCAL_API_BASE = (() => {
    const backendOrigin = new URL(window.location.origin);
    backendOrigin.port = '1702';
    return `${backendOrigin.origin}/api/v1`;
  })();

  // Select the API endpoint based on the current environment.
  let defaultBase = PRODUCTION_API_BASE;

  if (
    window.location.protocol.startsWith('http') &&
    window.location.port === '5500'
  ) {
    defaultBase = LOCAL_API_BASE;
  }

  // Allow an explicit runtime override when needed.
  const BASE_URL = String(
    window.LT_API_BASE_URL || defaultBase
  ).replace(/\/+$/, '');

  class ApiError extends Error {
    constructor(
      status,
      code,
      message,
      details = undefined,
      requestId = undefined
    ) {
      super(message || 'The request could not be completed.');

      this.name = 'ApiError';
      this.status = status;
      this.code = code || 'API_ERROR';
      this.details = details;
      this.requestId = requestId;
    }
  }

  async function request(path, options = {}) {
    let response;

    try {
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(options.headers || {})
        },
        cache: 'no-store'
      });
    } catch (error) {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'The game service could not be reached. Check your connection and try again.'
      );
    }

    let payload;

    try {
      payload = await response.json();
    } catch {
      throw new ApiError(
        response.status,
        'INVALID_API_RESPONSE',
        'The game service returned an unreadable response.'
      );
    }

    if (!response.ok) {
      const details = payload?.error?.details;

      throw new ApiError(
        response.status,
        payload?.error?.code,
        payload?.error?.message,
        details,
        payload?.error?.requestId
      );
    }

    if (
      !payload ||
      !Object.prototype.hasOwnProperty.call(payload, 'data')
    ) {
      throw new ApiError(
        response.status,
        'INVALID_API_RESPONSE',
        'The game service returned an unexpected response.'
      );
    }

    return payload.data;
  }

  const post = (path, body) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });

  window.LTAPI = Object.freeze({
    ApiError,
    baseUrl: BASE_URL,

    getHealth: () => request('/health'),

    getTopics: () => request('/topics'),

    getCatalog: (topicCode) =>
      request(`/topics/${encodeURIComponent(topicCode)}/catalog`),

    nextActivity: (body) =>
      post('/gameplay/next-activity', body),

    resolveFate: (body) =>
      post('/gameplay/resolve-fate', body),

    nextQuestionZone: (body) =>
      post('/gameplay/question-zone/next', body)
  });
})();
