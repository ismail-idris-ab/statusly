import * as Sentry from '@sentry/react-native';

import { env } from './env';

/**
 * Crash reporting (Doc 02). No-op until `SENTRY_DSN` is provided at build time,
 * so dev builds never phone home. Sentry is the only non-ads network egress.
 */
export function initSentry(): void {
  if (!env.sentryDsn) {
    return;
  }
  Sentry.init({
    dsn: env.sentryDsn,
    // Keep tracing off by default; this is a privacy-first, on-device app.
    tracesSampleRate: 0,
  });
}
