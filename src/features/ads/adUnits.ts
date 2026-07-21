import { TestIds } from 'react-native-google-mobile-ads';

import { env } from '@/lib/env';

// Real unit ids ship only in production builds; dev always uses Google's test
// units so we never touch real inventory (CLAUDE.md constraint).
const useReal = !__DEV__;

export const adUnitIds = {
  banner:
    useReal && env.admob.bannerUnitId ? env.admob.bannerUnitId : TestIds.BANNER,
  interstitial:
    useReal && env.admob.interstitialUnitId
      ? env.admob.interstitialUnitId
      : TestIds.INTERSTITIAL,
};
