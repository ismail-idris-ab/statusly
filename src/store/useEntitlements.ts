import { create } from 'zustand';

import { prefs } from '@/lib/preferences';

/**
 * Reactive "Remove Ads" entitlement. Seeded from MMKV so it survives restarts;
 * the setter mirrors back to MMKV. Ad components subscribe here so they vanish
 * the instant a purchase (or restore) completes.
 */
type Entitlements = {
  removedAds: boolean;
  setRemovedAds: (value: boolean) => void;
};

export const useEntitlements = create<Entitlements>((set) => ({
  removedAds: prefs.getHasRemovedAds(),
  setRemovedAds: (value) => {
    prefs.setHasRemovedAds(value);
    set({ removedAds: value });
  },
}));
