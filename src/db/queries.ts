import { newId } from '@/lib/id';

import type { SqliteAdapter } from './adapter';
import {
  mapQuote,
  mapSavedItem,
  mapSeenStatusHash,
  mapTrackedContact,
  QuoteRow,
  SavedItemRow,
  SeenStatusHashRow,
  TrackedContactRow,
  type Quote,
  type SavedItem,
  type SavedSource,
  type SeenStatusHash,
  type StatusType,
  type TrackedContact,
} from './types';

const bit = (b: boolean): 0 | 1 => (b ? 1 : 0);

// ===========================================================================
// saved_items
// ===========================================================================

export type NewSavedItem = {
  type: StatusType;
  source: SavedSource;
  localUri: string;
  sizeBytes: number;
  originName?: string | null;
  durationMs?: number | null;
  thumbUri?: string | null;
  originModifiedAt?: number | null;
  /** Overridable for deterministic tests; defaults to a fresh uuid. */
  id?: string;
  /** Overridable for deterministic tests; defaults to `Date.now()`. */
  savedAt?: number;
};

export async function insertSavedItem(
  db: SqliteAdapter,
  input: NewSavedItem,
): Promise<SavedItem> {
  const item: SavedItem = {
    id: input.id ?? newId(),
    type: input.type,
    source: input.source,
    localUri: input.localUri,
    originName: input.originName ?? null,
    sizeBytes: input.sizeBytes,
    durationMs: input.durationMs ?? null,
    thumbUri: input.thumbUri ?? null,
    savedAt: input.savedAt ?? Date.now(),
    originModifiedAt: input.originModifiedAt ?? null,
  };

  await db.runAsync(
    `INSERT INTO saved_items
       (id, type, source, local_uri, origin_name, size_bytes, duration_ms,
        thumb_uri, saved_at, origin_modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.type,
      item.source,
      item.localUri,
      item.originName,
      item.sizeBytes,
      item.durationMs,
      item.thumbUri,
      item.savedAt,
      item.originModifiedAt,
    ],
  );

  return item;
}

export type SavedFilter = StatusType | 'all';

export async function listSavedItems(
  db: SqliteAdapter,
  filter: SavedFilter = 'all',
): Promise<SavedItem[]> {
  const rows =
    filter === 'all'
      ? await db.getAllAsync<unknown>(
          'SELECT * FROM saved_items ORDER BY saved_at DESC',
        )
      : await db.getAllAsync<unknown>(
          'SELECT * FROM saved_items WHERE type = ? ORDER BY saved_at DESC',
          [filter],
        );
  return rows.map((r) => mapSavedItem(SavedItemRow.parse(r)));
}

export async function getSavedItem(
  db: SqliteAdapter,
  id: string,
): Promise<SavedItem | null> {
  const row = await db.getFirstAsync<unknown>(
    'SELECT * FROM saved_items WHERE id = ?',
    [id],
  );
  return row ? mapSavedItem(SavedItemRow.parse(row)) : null;
}

export async function deleteSavedItem(
  db: SqliteAdapter,
  id: string,
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM saved_items WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function countSavedItems(
  db: SqliteAdapter,
  filter: SavedFilter = 'all',
): Promise<number> {
  const row =
    filter === 'all'
      ? await db.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) AS n FROM saved_items',
        )
      : await db.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) AS n FROM saved_items WHERE type = ?',
          [filter],
        );
  return row?.n ?? 0;
}

// ===========================================================================
// tracked_contacts
// ===========================================================================

export type NewTrackedContact = {
  matchKey: string;
  label?: string | null;
  avatarUri?: string | null;
  alertsEnabled?: boolean;
  id?: string;
  createdAt?: number;
};

export async function insertTrackedContact(
  db: SqliteAdapter,
  input: NewTrackedContact,
): Promise<TrackedContact> {
  const contact: TrackedContact = {
    id: input.id ?? newId(),
    label: input.label ?? null,
    matchKey: input.matchKey,
    avatarUri: input.avatarUri ?? null,
    alertsEnabled: input.alertsEnabled ?? false,
    createdAt: input.createdAt ?? Date.now(),
  };

  await db.runAsync(
    `INSERT INTO tracked_contacts
       (id, label, match_key, avatar_uri, alerts_enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      contact.id,
      contact.label,
      contact.matchKey,
      contact.avatarUri,
      bit(contact.alertsEnabled),
      contact.createdAt,
    ],
  );

  return contact;
}

export async function listTrackedContacts(
  db: SqliteAdapter,
  onlyEnabled = false,
): Promise<TrackedContact[]> {
  const rows = onlyEnabled
    ? await db.getAllAsync<unknown>(
        'SELECT * FROM tracked_contacts WHERE alerts_enabled = 1 ORDER BY created_at DESC',
      )
    : await db.getAllAsync<unknown>(
        'SELECT * FROM tracked_contacts ORDER BY created_at DESC',
      );
  return rows.map((r) => mapTrackedContact(TrackedContactRow.parse(r)));
}

export async function findContactByMatchKey(
  db: SqliteAdapter,
  matchKey: string,
): Promise<TrackedContact | null> {
  const row = await db.getFirstAsync<unknown>(
    'SELECT * FROM tracked_contacts WHERE match_key = ?',
    [matchKey],
  );
  return row ? mapTrackedContact(TrackedContactRow.parse(row)) : null;
}

export async function setContactAlerts(
  db: SqliteAdapter,
  id: string,
  enabled: boolean,
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE tracked_contacts SET alerts_enabled = ? WHERE id = ?',
    [bit(enabled), id],
  );
  return result.changes > 0;
}

export async function deleteTrackedContact(
  db: SqliteAdapter,
  id: string,
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM tracked_contacts WHERE id = ?',
    [id],
  );
  return result.changes > 0;
}

// ===========================================================================
// seen_status_hashes
// ===========================================================================

export type NewSeenHash = {
  hash: string;
  contactKey?: string | null;
  firstSeenAt?: number;
};

/** Records a hash. Returns true if it was new (false if already seen). */
export async function recordSeenHash(
  db: SqliteAdapter,
  input: NewSeenHash,
): Promise<boolean> {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO seen_status_hashes
       (hash, contact_key, first_seen_at, notified)
     VALUES (?, ?, ?, 0)`,
    [input.hash, input.contactKey ?? null, input.firstSeenAt ?? Date.now()],
  );
  return result.changes > 0;
}

export async function hasSeenHash(
  db: SqliteAdapter,
  hash: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT 1 AS n FROM seen_status_hashes WHERE hash = ?',
    [hash],
  );
  return row !== null;
}

export async function markHashNotified(
  db: SqliteAdapter,
  hash: string,
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE seen_status_hashes SET notified = 1 WHERE hash = ?',
    [hash],
  );
  return result.changes > 0;
}

export async function listUnnotifiedHashes(
  db: SqliteAdapter,
): Promise<SeenStatusHash[]> {
  const rows = await db.getAllAsync<unknown>(
    'SELECT * FROM seen_status_hashes WHERE notified = 0 ORDER BY first_seen_at ASC',
  );
  return rows.map((r) => mapSeenStatusHash(SeenStatusHashRow.parse(r)));
}

/** Deletes hashes older than the cutoff. Returns the number removed. */
export async function pruneSeenHashes(
  db: SqliteAdapter,
  olderThanMs: number,
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM seen_status_hashes WHERE first_seen_at < ?',
    [olderThanMs],
  );
  return result.changes;
}

// ===========================================================================
// quotes
// ===========================================================================

export async function listQuotes(
  db: SqliteAdapter,
  category?: string,
): Promise<Quote[]> {
  const rows = category
    ? await db.getAllAsync<unknown>(
        'SELECT * FROM quotes WHERE category = ? ORDER BY id ASC',
        [category],
      )
    : await db.getAllAsync<unknown>('SELECT * FROM quotes ORDER BY id ASC');
  return rows.map((r) => mapQuote(QuoteRow.parse(r)));
}

export async function listFavoriteQuotes(db: SqliteAdapter): Promise<Quote[]> {
  const rows = await db.getAllAsync<unknown>(
    'SELECT * FROM quotes WHERE is_favorite = 1 ORDER BY id ASC',
  );
  return rows.map((r) => mapQuote(QuoteRow.parse(r)));
}

export async function listQuoteCategories(
  db: SqliteAdapter,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM quotes ORDER BY category ASC',
  );
  return rows.map((r) => r.category);
}

export async function setQuoteFavorite(
  db: SqliteAdapter,
  id: string,
  favorite: boolean,
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE quotes SET is_favorite = ? WHERE id = ?',
    [bit(favorite), id],
  );
  return result.changes > 0;
}

export async function countQuotes(db: SqliteAdapter): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM quotes',
  );
  return row?.n ?? 0;
}
