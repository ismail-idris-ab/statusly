import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ALERTS_CHANNEL = 'status-alerts';

// Show alerts as a banner/list entry; no sound/badge noise (utility app).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Creates the Android notification channel for status alerts. */
export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALERTS_CHANNEL, {
      name: 'Status alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Ensures POST_NOTIFICATIONS is granted; returns the result. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Fires a single "N new statuses" notification that deep-links to Status. */
export async function presentNewStatusesNotification(
  count: number,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New statuses on WhatsApp',
      body:
        count === 1
          ? '1 new status to save'
          : `${count} new statuses to save`,
      data: { route: '/status' },
    },
    trigger: null,
  });
}
