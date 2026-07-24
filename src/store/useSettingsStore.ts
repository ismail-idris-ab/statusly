import { create } from 'zustand';

import { prefs, type ThemePref } from '@/lib/preferences';

export type { ThemePref };

type SettingsState = {
  theme: ThemePref;
  setTheme: (theme: ThemePref) => void;
};

/**
 * Global settings, hydrated from MMKV (via `prefs`) on creation and written
 * back on every change so state survives restarts (Doc 05). The "Remove Ads"
 * entitlement lives in `useEntitlements` — the single source of truth for ad
 * gating — so it is intentionally not duplicated here.
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  theme: prefs.getTheme(),
  setTheme: (theme) => {
    prefs.setTheme(theme);
    set({ theme });
  },
}));
