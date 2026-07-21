import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getDatabase } from '@/db';
import { pruneSeenHashes, recordSeenHash } from '@/db/queries';
import { prefs } from '@/lib/preferences';
import {
  hasStatusAccess,
  listStatuses,
  type StatusFile,
} from '@/native/StatusAccessModule';

import { presentNewStatusesNotification } from './notifications';

export const ALERTS_TASK = 'statusly-status-alerts';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Stable dedupe key for a status file (Doc 05 — hash of name+size+mtime). */
function hashFor(file: StatusFile): string {
  return `${file.name}:${file.sizeBytes}:${file.lastModified}`;
}

/**
 * Lists current statuses, records unseen ones in `seen_status_hashes`, prunes
 * the rolling window, and (when `notify`) fires one notification for the new
 * count. Returns how many were new. Called with `notify=false` to baseline on
 * enable so only future statuses alert.
 */
export async function checkForNewStatuses(notify: boolean): Promise<number> {
  if (!(await hasStatusAccess('whatsapp'))) {
    return 0;
  }
  const db = await getDatabase();
  const files = await listStatuses('whatsapp');
  const now = Date.now();

  let fresh = 0;
  for (const file of files) {
    const isNew = await recordSeenHash(db, {
      hash: hashFor(file),
      firstSeenAt: now,
    });
    if (isNew) {
      fresh += 1;
    }
  }
  await pruneSeenHashes(db, now - SEVEN_DAYS_MS);

  if (notify && fresh > 0) {
    await presentNewStatusesNotification(fresh);
  }
  return fresh;
}

// Defined at module load so the headless background runtime can find it.
TaskManager.defineTask(ALERTS_TASK, async () => {
  try {
    if (prefs.getAlertsEnabled()) {
      await checkForNewStatuses(true);
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the periodic background check (WorkManager; ~15 min minimum). */
export async function registerAlertsTask(): Promise<void> {
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    return;
  }
  await BackgroundTask.registerTaskAsync(ALERTS_TASK, {
    minimumInterval: prefs.getAlertsIntervalMin(),
  });
}

export async function unregisterAlertsTask(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(ALERTS_TASK)) {
    await BackgroundTask.unregisterTaskAsync(ALERTS_TASK);
  }
}
