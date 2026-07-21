import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Expo CLI loads `.env` into `process.env` before evaluating
 * this file, so build-time secrets (ad unit IDs, Sentry DSN) flow through `extra`.
 * Android-only for v1 (Doc 01). SAF-based status access — NO MANAGE_EXTERNAL_STORAGE.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Statusly',
  slug: 'statusly',
  owner: 'aiiman',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'statusly',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon/icon_store_1024.png',
  // New Architecture is the default in SDK 57 — no config flag needed.
  android: {
    package: 'com.statusly.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/icon/adaptive_foreground.png',
      backgroundImage: './assets/icon/adaptive_background.png',
    },
    // Doc 02 — TRD. SAF handles status folder access; broad storage is NOT requested.
    permissions: [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'com.android.vending.BILLING',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
    blockedPermissions: ['android.permission.MANAGE_EXTERNAL_STORAGE'],
  },
  plugins: [
    'expo-router',
    'expo-font',
    '@sentry/react-native',
    'expo-video',
    'expo-sharing',
    'expo-background-task',
    './plugins/withStatusFileProvider',
    [
      'react-native-google-mobile-ads',
      {
        // Real app id is injected at build time; dev falls back to Google's
        // public AdMob TEST app id so no real inventory is ever requested.
        androidAppId:
          process.env.ADMOB_ANDROID_APP_ID ||
          'ca-app-pub-3940256099942544~3347511713',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#0E8F6E',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'Allow Statusly to save statuses to your gallery.',
        savePhotosPermission: 'Allow Statusly to save statuses to your gallery.',
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/icon/icon_512.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#0E8F6E',
        dark: {
          backgroundColor: '#0B1411',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    admob: {
      androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? '',
      bannerUnitId: process.env.ADMOB_BANNER_UNIT_ID ?? '',
      interstitialUnitId: process.env.ADMOB_INTERSTITIAL_UNIT_ID ?? '',
      appOpenUnitId: process.env.ADMOB_APPOPEN_UNIT_ID ?? '',
      nativeUnitId: process.env.ADMOB_NATIVE_UNIT_ID ?? '',
    },
    iap: {
      removeAdsSku: process.env.IAP_REMOVE_ADS_SKU ?? 'remove_ads',
    },
    sentryDsn: process.env.SENTRY_DSN ?? '',
    eas: {
      projectId: '539d0e80-04fa-4552-809d-af11100aaa65',
    },
  },
});
