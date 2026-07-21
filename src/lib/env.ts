import Constants from 'expo-constants';

/**
 * Typed accessor for build-time config injected via `app.config.ts` `extra`.
 * Real ad unit IDs / Sentry DSN are empty in dev (Phase 1) and populated at
 * build time (Phase 9). Ad code always falls back to AdMob test IDs when empty.
 */
type Extra = {
  admob: {
    androidAppId: string;
    bannerUnitId: string;
    interstitialUnitId: string;
    appOpenUnitId: string;
    nativeUnitId: string;
  };
  iap: { removeAdsSku: string };
  sentryDsn: string;
};

const fallback: Extra = {
  admob: {
    androidAppId: '',
    bannerUnitId: '',
    interstitialUnitId: '',
    appOpenUnitId: '',
    nativeUnitId: '',
  },
  iap: { removeAdsSku: 'remove_ads' },
  sentryDsn: '',
};

export const env: Extra = {
  ...fallback,
  ...(Constants.expoConfig?.extra as Partial<Extra> | undefined),
};
