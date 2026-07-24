// SDK 57's default expo-media-library entry throws on the classic methods
// (saveToLibraryAsync/getAssetsAsync). The `/legacy` entry keeps them working.
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { ToastAndroid } from 'react-native';

import { getDatabase } from '@/db';
import { insertSavedItem } from '@/db/queries';
import {
  cacheStatus,
  shareMultiple,
  type StatusFile,
  type StatusSource,
} from '@/native/StatusAccessModule';
import { prefs } from '@/lib/preferences';

function toast(message: string): void {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

/** Requests gallery (photo + video) access. A status saver never needs audio. */
async function requestGalleryPermission(): Promise<boolean> {
  const permission = await MediaLibrary.requestPermissionsAsync(false, [
    'photo',
    'video',
  ]);
  return permission.granted;
}

/**
 * Copies a status into the gallery (original quality) and records it in
 * `saved_items`. No permission prompt or toast — callers handle those so a
 * batch save asks once and reports once.
 */
async function persistToGallery(
  status: StatusFile,
  source: StatusSource,
): Promise<boolean> {
  try {
    // MediaLibrary needs a file:// path; the native module copies the SAF
    // content:// bytes into app cache unchanged (original quality).
    const filePath = await cacheStatus(status.uri);

    // createAssetAsync saves to the gallery AND returns the exact created asset,
    // so the recorded localUri is precisely this item — unlike guessing the
    // "newest" via getAssetsAsync, which returned the same asset every time and
    // made the Saved library show one identical image/video.
    const asset = await MediaLibrary.createAssetAsync(filePath);

    const db = await getDatabase();
    await insertSavedItem(db, {
      type: status.type,
      source,
      localUri: asset.uri,
      originName: status.name,
      sizeBytes: status.sizeBytes,
      originModifiedAt: status.lastModified,
    });
    prefs.incrementSavedCount();
    return true;
  } catch {
    return false;
  }
}

/** Saves one status to the gallery (action-trio Save). */
export async function saveStatus(
  status: StatusFile,
  source: StatusSource = 'whatsapp',
): Promise<boolean> {
  if (!(await requestGalleryPermission())) {
    toast('Gallery permission needed to save');
    return false;
  }
  const ok = await persistToGallery(status, source);
  toast(ok ? 'Saved to gallery' : "Couldn't save this status");
  return ok;
}

/** Batch-saves many statuses, asking permission once and reporting once. */
export async function saveMany(
  statuses: StatusFile[],
  source: StatusSource = 'whatsapp',
): Promise<number> {
  if (statuses.length === 0) {
    return 0;
  }
  if (!(await requestGalleryPermission())) {
    toast('Gallery permission needed to save');
    return 0;
  }
  let saved = 0;
  for (const status of statuses) {
    if (await persistToGallery(status, source)) {
      saved += 1;
    }
  }
  toast(saved > 0 ? `Saved ${saved} to gallery` : "Couldn't save");
  return saved;
}

/** Opens the Android share sheet for a status (Share action). */
export async function shareStatus(status: StatusFile): Promise<void> {
  // Cache first: a failure here is a real IO error the user should hear about.
  let filePath: string;
  try {
    filePath = await cacheStatus(status.uri);
  } catch {
    toast("Couldn't share this status");
    return;
  }
  try {
    if (!(await Sharing.isAvailableAsync())) {
      toast('Sharing is not available');
      return;
    }
    await Sharing.shareAsync(filePath, {
      mimeType: status.mime,
      dialogTitle: 'Share status',
    });
  } catch {
    // User dismissed the sheet or the share target failed — nothing to do.
  }
}

/** Batch-shares many statuses at once via ACTION_SEND_MULTIPLE. */
export async function shareMany(statuses: StatusFile[]): Promise<void> {
  if (statuses.length === 0) {
    return;
  }
  if (statuses.length === 1) {
    await shareStatus(statuses[0]!);
    return;
  }
  try {
    const paths: string[] = [];
    for (const status of statuses) {
      paths.push(await cacheStatus(status.uri));
    }
    const allVideo = statuses.every((s) => s.type === 'video');
    const allImage = statuses.every((s) => s.type === 'image');
    const mime = allVideo ? 'video/*' : allImage ? 'image/*' : '*/*';
    await shareMultiple(paths, mime);
  } catch {
    toast("Couldn't share these statuses");
  }
}

/**
 * Repost = the compliant route to one's own status: open the share sheet with
 * the cached file; the user picks WhatsApp → "My status" (Doc 02).
 */
export async function repostStatus(status: StatusFile): Promise<void> {
  let filePath: string;
  try {
    filePath = await cacheStatus(status.uri);
  } catch {
    toast("Couldn't repost this status");
    return;
  }
  try {
    if (!(await Sharing.isAvailableAsync())) {
      toast('Sharing is not available');
      return;
    }
    await Sharing.shareAsync(filePath, {
      mimeType: status.mime,
      dialogTitle: 'Repost to your status',
    });
  } catch {
    // User dismissed the sheet or the share target failed.
  }
}
