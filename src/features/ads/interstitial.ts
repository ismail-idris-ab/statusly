import {
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';

import { prefs } from '@/lib/preferences';

import { adUnitIds } from './adUnits';

// Show an interstitial at most once every N qualifying actions, and never when
// ads are removed. A fresh ad is preloaded after each close.
const SHOW_EVERY = 4;

let ad: InterstitialAd | null = null;
let loaded = false;
let actionCount = 0;

export function preloadInterstitial(): void {
  if (prefs.getHasRemovedAds()) {
    return;
  }
  ad = InterstitialAd.createForAdRequest(adUnitIds.interstitial);
  loaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    loaded = false;
    preloadInterstitial();
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
  });
  ad.load();
}

/** Call on a natural break (e.g. opening the viewer); throttled + gated. */
export function maybeShowInterstitial(): void {
  if (prefs.getHasRemovedAds()) {
    return;
  }
  actionCount += 1;
  if (actionCount % SHOW_EVERY !== 0) {
    return;
  }
  if (loaded && ad) {
    ad.show();
  }
}
