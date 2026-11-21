import { init, captureException, withScope, addBreadcrumb, setTag, SDK_VERSION } from '@sentry/browser';
window.Sentry = { init, captureException, withScope, addBreadcrumb, setTag, SDK_VERSION };
