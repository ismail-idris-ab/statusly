import { requireNativeModule } from 'expo';
import { z } from 'zod';

import { prefs, type StatusSource } from '@/lib/preferences';

/* eslint-disable @typescript-eslint/no-redeclare -- Zod value/type share a name. */

export type { StatusSource };

/** A single status media file returned by the native module (Doc 02). */
export const StatusFile = z.object({
  uri: z.string(),
  name: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
  lastModified: z.number(),
  type: z.enum(['image', 'video']),
});
export type StatusFile = z.infer<typeof StatusFile>;
const StatusFiles = z.array(StatusFile);

export const StatusFolderGrant = z.object({
  granted: z.boolean(),
  treeUri: z.string(),
});
export type StatusFolderGrant = z.infer<typeof StatusFolderGrant>;

/* eslint-enable @typescript-eslint/no-redeclare */

/** Shape of the raw native module; JS results are Zod-validated at this boundary. */
type NativeStatusAccess = {
  hasAccess(source: StatusSource): Promise<boolean>;
  requestStatusFolderAccess(source: StatusSource): Promise<unknown>;
  listStatuses(source: StatusSource): Promise<unknown>;
  cacheStatus(uri: string): Promise<string>;
  shareMultiple(paths: string[], mime: string): Promise<void>;
  clearStatusCache(): Promise<void>;
};

// Throws if the native module is missing (e.g. before a dev rebuild). Only
// import this module from status-access features, never at app startup.
const native = requireNativeModule<NativeStatusAccess>('StatusAccess');

/**
 * Launches the SAF folder picker seeded to the `.Statuses` folder and persists
 * the grant. On success, caches the tree URI in MMKV for quick startup checks.
 */
export async function requestStatusFolderAccess(
  source: StatusSource,
): Promise<StatusFolderGrant> {
  const grant = StatusFolderGrant.parse(
    await native.requestStatusFolderAccess(source),
  );
  if (grant.granted && grant.treeUri) {
    prefs.setFolderGrant(source, grant.treeUri);
  }
  return grant;
}

/** True if a persisted, still-valid grant exists for the source. */
export async function hasStatusAccess(source: StatusSource): Promise<boolean> {
  return native.hasAccess(source);
}

/**
 * Verifies the OS-level grant is still valid; clears the cached MMKV pointer if
 * the grant was revoked so onboarding can re-request it (Doc 03 revoke flow).
 */
export async function ensureStatusAccess(
  source: StatusSource,
): Promise<boolean> {
  const ok = await native.hasAccess(source);
  if (!ok) {
    prefs.clearFolderGrant(source);
  }
  return ok;
}

/** Lists status files (newest first), validated against the schema. */
export async function listStatuses(
  source: StatusSource,
): Promise<StatusFile[]> {
  return StatusFiles.parse(await native.listStatuses(source));
}

/** Copies a status file into app cache and returns a readable `file://` path. */
export async function cacheStatus(uri: string): Promise<string> {
  return native.cacheStatus(uri);
}

/** Shares several cached `file://` paths at once (ACTION_SEND_MULTIPLE). */
export async function shareMultiple(
  paths: string[],
  mime: string,
): Promise<void> {
  return native.shareMultiple(paths, mime);
}

/** Empties the share/save cache dir so cached copies never accumulate. */
export async function clearStatusCache(): Promise<void> {
  return native.clearStatusCache();
}
