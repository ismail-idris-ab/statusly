import { describe, expect, it } from '@jest/globals';

import { createTestDatabase } from '../../../test/helpers/testDatabase';
import type { SqliteAdapter } from '../adapter';
import { LATEST_VERSION, runMigrations } from '../migrations';

async function userVersion(db: SqliteAdapter): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  return row?.user_version ?? -1;
}

async function tableNames(db: SqliteAdapter): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  return rows.map((r) => r.name);
}

describe('runMigrations', () => {
  it('creates all four tables and stamps the latest version', async () => {
    const db = await createTestDatabase();
    await runMigrations(db);

    expect(await userVersion(db)).toBe(LATEST_VERSION);
    expect(await tableNames(db)).toEqual(
      expect.arrayContaining([
        'quotes',
        'saved_items',
        'seen_status_hashes',
        'tracked_contacts',
      ]),
    );
  });

  it('is idempotent when run repeatedly', async () => {
    const db = await createTestDatabase();
    await runMigrations(db);
    await runMigrations(db);
    await runMigrations(db);

    expect(await userVersion(db)).toBe(LATEST_VERSION);
    // Still exactly the four app tables (no duplicates / errors).
    const tables = (await tableNames(db)).filter(
      (t) => !t.startsWith('sqlite_'),
    );
    expect(tables).toHaveLength(4);
  });

  it('creates the expected indexes', async () => {
    const db = await createTestDatabase();
    await runMigrations(db);
    const rows = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index'",
    );
    const names = rows.map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'idx_saved_type',
        'idx_saved_saved_at',
        'idx_tracked_alerts',
        'idx_seen_first_seen',
        'idx_quotes_category',
      ]),
    );
  });
});
