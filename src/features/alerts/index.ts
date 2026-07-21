import { prefs } from '@/lib/preferences';

import { requestNotificationPermission } from './notifications';
import {
  checkForNewStatuses,
  registerAlertsTask,
  unregisterAlertsTask,
} from './task';

export { configureNotifications } from './notifications';
export { ALERTS_TASK, checkForNewStatuses } from './task';

/**
 * Turns on new-status alerts: request notification permission, baseline the
 * current statuses (so only future ones alert), then register the background
 * task. Returns false if permission was denied.
 */
export async function enableAlerts(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  prefs.setNotificationsGranted(granted);
  if (!granted) {
    return false;
  }
  await checkForNewStatuses(false);
  prefs.setAlertsEnabled(true);
  await registerAlertsTask();
  return true;
}

export async function disableAlerts(): Promise<void> {
  prefs.setAlertsEnabled(false);
  await unregisterAlertsTask();
}

/** Re-registers the task on launch if alerts are enabled (idempotent). */
export async function syncAlertsRegistration(): Promise<void> {
  if (prefs.getAlertsEnabled()) {
    await registerAlertsTask();
  }
}
