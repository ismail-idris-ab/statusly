import * as Sentry from '@sentry/react-native';

type AdFormat = 'banner' | 'interstitial';

// One report per format per session: no-fill repeats on every request and
// would otherwise burn the Sentry quota without adding signal.
const reported = new Set<AdFormat>();

/** Sends an ad load failure (format + SDK error code) to Sentry, once per session. */
export function reportAdError(format: AdFormat, error: unknown): void {
  if (reported.has(format)) {
    return;
  }
  reported.add(format);

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : 'unknown';
  const message = error instanceof Error ? error.message : String(error);

  Sentry.captureMessage(`Ad failed to load: ${format} (${code})`, {
    level: 'warning',
    tags: { ad_format: format, ad_error_code: code },
    extra: { message },
    fingerprint: ['ad-load-failure', format, code],
  });
}
