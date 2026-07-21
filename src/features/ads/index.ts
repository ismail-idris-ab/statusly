import mobileAds, {
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';

import { prefs } from '@/lib/preferences';

import { preloadInterstitial } from './interstitial';

export { BannerAdSlot } from './BannerAdSlot';
export { maybeShowInterstitial } from './interstitial';

/** Initializes the AdMob SDK and preloads the first interstitial (dev = test). */
export async function initAds(): Promise<void> {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
  });
  await mobileAds().initialize();
  if (!prefs.getHasRemovedAds()) {
    preloadInterstitial();
  }
}
