import { describe, expect, it } from '@jest/globals';

import { createTestDatabase } from '../../../test/helpers/testDatabase';
import type { SqliteAdapter } from '../adapter';
import { runMigrations } from '../migrations';
import {
  countQuotes,
  countSavedItems,
  deleteSavedItem,
  deleteTrackedContact,
  findContactByMatchKey,
  getSavedItem,
  hasSeenHash,
  insertSavedItem,
  insertTrackedContact,
  listFavoriteQuotes,
  listQuoteCategories,
  listQuotes,
  listSavedItems,
  listTrackedContacts,
  listUnnotifiedHashes,
  markHashNotified,
  pruneSeenHashes,
  recordSeenHash,
  setContactAlerts,
  setQuoteFavorite,
} from '../queries';
import { loadSeedQuotes, seedQuotes } from '../seed';

async function freshDb(): Promise<SqliteAdapter> {
  const db = await createTestDatabase();
  await runMigrations(db);
  return db;
}

describe('saved_items queries', () => {
  it('inserts, lists (newest first), filters, gets, and deletes', async () => {
    const db = await freshDb();

    await insertSavedItem(db, {
      id: 'a',
      type: 'image',
      source: 'whatsapp',
      localUri: 'file://a.jpg',
      sizeBytes: 100,
      savedAt: 1000,
    });
    await insertSavedItem(db, {
      id: 'b',
      type: 'video',
      source: 'business',
      localUri: 'file://b.mp4',
      sizeBytes: 200,
      durationMs: 5000,
      savedAt: 2000,
    });

    const all = await listSavedItems(db);
    expect(all.map((i) => i.id)).toEqual(['b', 'a']); // saved_at DESC

    const images = await listSavedItems(db, 'image');
    expect(images).toHaveLength(1);
    expect(images[0]?.id).toBe('a');

    const video = await getSavedItem(db, 'b');
    expect(video?.durationMs).toBe(5000);
    expect(video?.type).toBe('video');

    expect(await countSavedItems(db)).toBe(2);
    expect(await countSavedItems(db, 'video')).toBe(1);

    expect(await deleteSavedItem(db, 'a')).toBe(true);
    expect(await deleteSavedItem(db, 'a')).toBe(false);
    expect(await countSavedItems(db)).toBe(1);
  });

  it('generates a uuid and timestamp when not provided', async () => {
    const db = await freshDb();
    const item = await insertSavedItem(db, {
      type: 'image',
      source: 'whatsapp',
      localUri: 'file://x.jpg',
      sizeBytes: 1,
    });
    expect(item.id).toMatch(/^[0-9a-f-]+$/);
    expect(item.savedAt).toBeGreaterThan(0);
  });
});

describe('tracked_contacts queries', () => {
  it('inserts, toggles alerts, finds by match key, filters, and deletes', async () => {
    const db = await freshDb();

    const c = await insertTrackedContact(db, {
      id: 'c1',
      matchKey: 'key-1',
      label: 'Alex',
      createdAt: 10,
    });
    expect(c.alertsEnabled).toBe(false);

    await insertTrackedContact(db, {
      id: 'c2',
      matchKey: 'key-2',
      alertsEnabled: true,
      createdAt: 20,
    });

    expect(await listTrackedContacts(db)).toHaveLength(2);
    const enabled = await listTrackedContacts(db, true);
    expect(enabled.map((x) => x.id)).toEqual(['c2']);

    expect(await setContactAlerts(db, 'c1', true)).toBe(true);
    expect(await listTrackedContacts(db, true)).toHaveLength(2);

    const found = await findContactByMatchKey(db, 'key-1');
    expect(found?.label).toBe('Alex');
    expect(await findContactByMatchKey(db, 'missing')).toBeNull();

    expect(await deleteTrackedContact(db, 'c1')).toBe(true);
    expect(await listTrackedContacts(db)).toHaveLength(1);
  });
});

describe('seen_status_hashes queries', () => {
  it('dedupes, marks notified, lists unnotified, and prunes', async () => {
    const db = await freshDb();

    expect(await recordSeenHash(db, { hash: 'h1', firstSeenAt: 100 })).toBe(
      true,
    );
    expect(await recordSeenHash(db, { hash: 'h1', firstSeenAt: 100 })).toBe(
      false,
    ); // duplicate ignored
    expect(await hasSeenHash(db, 'h1')).toBe(true);
    expect(await hasSeenHash(db, 'nope')).toBe(false);

    await recordSeenHash(db, { hash: 'h2', firstSeenAt: 5_000 });
    expect(await markHashNotified(db, 'h1')).toBe(true);

    const unnotified = await listUnnotifiedHashes(db);
    expect(unnotified.map((h) => h.hash)).toEqual(['h2']);

    const removed = await pruneSeenHashes(db, 1_000); // removes first_seen_at < 1000
    expect(removed).toBe(1);
    expect(await hasSeenHash(db, 'h1')).toBe(false);
    expect(await hasSeenHash(db, 'h2')).toBe(true);
  });
});

describe('quotes seed + queries', () => {
  it('seeds idempotently and reads back by category / favorite', async () => {
    const db = await freshDb();
    const seeds = loadSeedQuotes();

    const first = await seedQuotes(db, seeds);
    expect(first).toBe(seeds.length);
    expect(await countQuotes(db)).toBe(seeds.length);

    // Re-seeding inserts nothing new (idempotent).
    const second = await seedQuotes(db, seeds);
    expect(second).toBe(0);
    expect(await countQuotes(db)).toBe(seeds.length);

    const categories = await listQuoteCategories(db);
    expect(categories.length).toBeGreaterThan(0);
    const firstCategory = categories[0];
    if (!firstCategory) throw new Error('expected a category');

    const inCategory = await listQuotes(db, firstCategory);
    expect(inCategory.every((q) => q.category === firstCategory)).toBe(true);

    const target = seeds[0];
    if (!target) throw new Error('expected a seed quote');
    expect(await setQuoteFavorite(db, target.id, true)).toBe(true);
    const favorites = await listFavoriteQuotes(db);
    expect(favorites.map((q) => q.id)).toEqual([target.id]);
    expect(favorites[0]?.isFavorite).toBe(true);
  });
});
