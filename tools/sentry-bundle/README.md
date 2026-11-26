# Self-hosted Sentry Browser SDK

`frontend/js/vendor/sentry.min.js` is a minimal build of the official
`@sentry/browser` package. It exposes only the functions that
`frontend/js/monitoring.js` uses: `init`, `captureException`, `withScope`,
`addBreadcrumb` and `setTag`. The build is about 90 KB minified (about 32 KB gzipped), and
`monitoring.js` loads it with `async`, so it does not block rendering.

The Sentry Loader Script (`js.sentry-cdn.com/<publicKey>.min.js`) was used
before. For this project it reported "The Sentry loader you are trying to use
isn't working anymore", so events never reached Sentry.

## Rebuild / upgrade

```bash
mkdir /tmp/sentry-build && cd /tmp/sentry-build
npm init -y
npm i @sentry/browser@<version> esbuild
cp <repo>/tools/sentry-bundle/entry.js .
npx esbuild entry.js --bundle --minify --format=iife --target=es2019 \
  --legal-comments=none --define:__SENTRY_DEBUG__=false --outfile=sentry.min.js
```

Prepend the licence header (see the first two lines of the current file) and
copy the result to `frontend/js/vendor/sentry.min.js`.
