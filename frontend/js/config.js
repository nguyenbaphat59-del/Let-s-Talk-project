/* LET'S TALK — public runtime configuration for monitoring and analytics.
 *
 * Both values are PUBLIC identifiers by design (they are visible in any page
 * that uses Google Analytics or Sentry), so they may live in browser code.
 * Never put Supabase keys or any secret here.
 *
 * Leave a value empty to disable that integration (local development, tests).
 *
 *  - gaMeasurementId: Google Analytics 4 → Admin → Data streams → Web → Measurement ID
 *                     format: G-XXXXXXXXXX
 *  - sentryDsn:       Sentry → Settings → Projects → <project> → Client Keys (DSN)
 *                     format: https://<publicKey>@o<org>.ingest.<region>.sentry.io/<projectId>
 */
(() => {
  'use strict';

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' ||
    window.location.protocol === 'file:';

  window.LT_CONFIG = Object.freeze({
    gaMeasurementId: 'G-187Q24EEMY',
    sentryDsn: 'https://e07c933ec2e34ec542c161ffc299f552@o4512471399661568.ingest.de.sentry.io/4512471410606160',
    environment: isLocal ? 'development' : 'production',
    release: 'lets-talk-frontend@1.0.0',
    // Local previews do not send analytics unless explicitly enabled.
    analyticsInDevelopment: false
  });
})();
