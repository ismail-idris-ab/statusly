import { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useEntitlements } from '@/store/useEntitlements';

import { adUnitIds } from './adUnits';

/**
 * Anchored adaptive banner, hidden entirely once ads are removed. If the ad
 * fails to load (e.g. offline), the whole slot collapses so there is no empty
 * bordered bar.
 */
export function BannerAdSlot() {
  const removedAds = useEntitlements((s) => s.removedAds);
  const [failed, setFailed] = useState(false);

  if (removedAds || failed) {
    return null;
  }

  return (
    <View className="items-center border-t border-border bg-surface">
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
