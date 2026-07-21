import { create } from 'zustand';

import { prefs, type ThemePref } from '@/lib/preferences';

export type { ThemePref };

type SettingsState = {
  theme: ThemePref;
  /** Source of truth is Play Billing (Phase 9); cached in MMKV for gating. */
  hasRemovedAds: boolean;
  setTheme: (theme: ThemePref) => void;
  setHasRemovedAds: (value: boolean) => void;
};

/**
 * Global settings, hydrated from MMKV (via `prefs`) on creation and written
 * back on every change so state survives restarts (Doc 05).
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  theme: prefs.getTheme(),
  hasRemovedAds: prefs.getHasRemovedAds(),
  setTheme: (theme) => {
    prefs.setTheme(theme);
    set({ theme });
  },
  setHasRemovedAds: (value) => {
    prefs.setHasRemovedAds(value);
    set({ hasRemovedAds: value });
  },
}));
