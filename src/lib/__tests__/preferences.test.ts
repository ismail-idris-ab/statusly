import { beforeEach, describe, expect, it } from '@jest/globals';

import { storage } from '@/lib/mmkv';
import { DEFAULT_ALERT_INTERVAL_MIN, prefs } from '@/lib/preferences';

beforeEach(() => {
  storage.clearAll();
});

describe('prefs', () => {
  it('defaults theme to system and persists changes', () => {
    expect(prefs.getTheme()).toBe('system');
    prefs.setTheme('dark');
    expect(prefs.getTheme()).toBe('dark');
    prefs.setTheme('light');
    expect(prefs.getTheme()).toBe('light');
  });

  it('defaults boolean flags to false and round-trips them', () => {
    expect(prefs.getHasRemovedAds()).toBe(false);
    expect(prefs.getNotificationsGranted()).toBe(false);
    expect(prefs.getAlertsEnabled()).toBe(false);
    expect(prefs.getOnboardingComplete()).toBe(false);

    prefs.setHasRemovedAds(true);
    prefs.setOnboardingComplete(true);
    expect(prefs.getHasRemovedAds()).toBe(true);
    expect(prefs.getOnboardingComplete()).toBe(true);
  });

  it('defaults the alert interval and stores overrides', () => {
    expect(prefs.getAlertsIntervalMin()).toBe(DEFAULT_ALERT_INTERVAL_MIN);
    prefs.setAlertsIntervalMin(15);
    expect(prefs.getAlertsIntervalMin()).toBe(15);
  });

  it('tracks the saved count with increment', () => {
    expect(prefs.getSavedCount()).toBe(0);
    expect(prefs.incrementSavedCount()).toBe(1);
    expect(prefs.incrementSavedCount()).toBe(2);
    expect(prefs.getSavedCount()).toBe(2);
  });

  it('stores folder grants independently per source', () => {
    expect(prefs.getFolderGrant('whatsapp')).toBeUndefined();
    prefs.setFolderGrant('whatsapp', 'content://wa');
    prefs.setFolderGrant('business', 'content://w4b');
    expect(prefs.getFolderGrant('whatsapp')).toBe('content://wa');
    expect(prefs.getFolderGrant('business')).toBe('content://w4b');

    prefs.clearFolderGrant('whatsapp');
    expect(prefs.getFolderGrant('whatsapp')).toBeUndefined();
    expect(prefs.getFolderGrant('business')).toBe('content://w4b');
  });
});
