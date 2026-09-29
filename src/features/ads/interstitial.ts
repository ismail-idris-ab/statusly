import {
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';

import { prefs } from '@/lib/preferences';

import { adUnitIds } from './adUnits';
import { reportAdError } from './reportAdError';

// Show an interstitial at most once every N qualifying actions, and never when
// ads are removed. A fresh ad is preloaded after each close.
const SHOW_EVERY = 4;

// Backoff between retries after a failed load (no-fill, offline); the last
// delay repeats so a long no-fill period costs one request every few minutes.
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 300_000];

let ad: InterstitialAd | null = null;
let loaded = false;
let actionCount = 0;
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry(): void {
  if (retryTimer) {
    return;
  }
  const delay =
    RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    preloadInterstitial();
  }, delay);
}

export function preloadInterstitial(): void {
  if (prefs.getHasRemovedAds()) {
    return;
  }
  ad?.removeAllListeners();
  ad = InterstitialAd.createForAdRequest(adUnitIds.interstitial);
  loaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    loaded = true;
    retryAttempt = 0;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    loaded = false;
    preloadInterstitial();
  });
  ad.addAdEventListener(AdEventType.ERROR, (error) => {
    loaded = false;
    reportAdError('interstitial', error);
    scheduleRetry();
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
