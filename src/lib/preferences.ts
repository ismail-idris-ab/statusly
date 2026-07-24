import {
  getBool,
  getNumber,
  getString,
  remove,
  setBool,
  setNumber,
  setString,
} from './mmkv';

/**
 * Typed facade over MMKV for every key in Doc 05. All app settings/flags read
 * and write through here so keys and value types stay consistent in one place.
 */
export type ThemePref = 'system' | 'light' | 'dark';
export type StatusSource = 'whatsapp' | 'business';

export const KEYS = {
  folderGrantWhatsapp: 'folderGrant.whatsapp',
  folderGrantBusiness: 'folderGrant.business',
  permNotifications: 'perm.notifications',
  hasRemovedAds: 'hasRemovedAds',
  alertsEnabled: 'alerts.enabled',
  alertsIntervalMin: 'alerts.intervalMin',
  onboardingComplete: 'onboarding.complete',
  theme: 'theme',
  statsSavedCount: 'stats.savedCount',
} as const;

export const DEFAULT_ALERT_INTERVAL_MIN = 30;

function folderKey(source: StatusSource): string {
  return source === 'business'
    ? KEYS.folderGrantBusiness
    : KEYS.folderGrantWhatsapp;
}

function readTheme(): ThemePref {
  const raw = getString(KEYS.theme);
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

export const prefs = {
  // SAF folder grant (persisted tree URI) --------------------------------
  getFolderGrant(source: StatusSource): string | undefined {
    return getString(folderKey(source));
  },
  setFolderGrant(source: StatusSource, treeUri: string): void {
    setString(folderKey(source), treeUri);
  },
  clearFolderGrant(source: StatusSource): void {
    remove(folderKey(source));
  },

  // Permissions ----------------------------------------------------------
  getNotificationsGranted(): boolean {
    return getBool(KEYS.permNotifications, false);
  },
  setNotificationsGranted(value: boolean): void {
    setBool(KEYS.permNotifications, value);
  },

  // IAP entitlement (cached; source of truth is Play Billing) ------------
  getHasRemovedAds(): boolean {
    return getBool(KEYS.hasRemovedAds, false);
  },
  setHasRemovedAds(value: boolean): void {
    setBool(KEYS.hasRemovedAds, value);
  },

  // Alerts ---------------------------------------------------------------
  getAlertsEnabled(): boolean {
    return getBool(KEYS.alertsEnabled, false);
  },
  setAlertsEnabled(value: boolean): void {
    setBool(KEYS.alertsEnabled, value);
  },
  getAlertsIntervalMin(): number {
    return getNumber(KEYS.alertsIntervalMin, DEFAULT_ALERT_INTERVAL_MIN);
  },
  setAlertsIntervalMin(value: number): void {
    setNumber(KEYS.alertsIntervalMin, value);
  },

  // Onboarding -----------------------------------------------------------
  getOnboardingComplete(): boolean {
    return getBool(KEYS.onboardingComplete, false);
  },
  setOnboardingComplete(value: boolean): void {
    setBool(KEYS.onboardingComplete, value);
  },

  // Theme ----------------------------------------------------------------
  getTheme(): ThemePref {
    return readTheme();
  },
  setTheme(value: ThemePref): void {
    setString(KEYS.theme, value);
  },

  // Stats ----------------------------------------------------------------
  getSavedCount(): number {
    return getNumber(KEYS.statsSavedCount, 0);
  },
  setSavedCount(value: number): void {
    setNumber(KEYS.statsSavedCount, value);
  },
  incrementSavedCount(): number {
    const next = getNumber(KEYS.statsSavedCount, 0) + 1;
    setNumber(KEYS.statsSavedCount, next);
    return next;
  },
};
