import type { SqliteAdapter } from './adapter';

/**
 * Forward-only, idempotent schema migrations keyed by `PRAGMA user_version`
 * (Doc 05). Each migration's `up` runs once, in a transaction, when the stored
 * version is below its number. Never edit a shipped migration — add a new one.
 */
export type Migration = {
  version: number;
  up: string;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS saved_items (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        origin_name TEXT,
        size_bytes INTEGER NOT NULL,
        duration_ms INTEGER,
        thumb_uri TEXT,
        saved_at INTEGER NOT NULL,
        origin_modified_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_saved_type ON saved_items(type);
      CREATE INDEX IF NOT EXISTS idx_saved_saved_at ON saved_items(saved_at DESC);

      CREATE TABLE IF NOT EXISTS tracked_contacts (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT,
        match_key TEXT NOT NULL,
        avatar_uri TEXT,
        alerts_enabled INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tracked_alerts ON tracked_contacts(alerts_enabled);

      CREATE TABLE IF NOT EXISTS seen_status_hashes (
        hash TEXT PRIMARY KEY NOT NULL,
        contact_key TEXT,
        first_seen_at INTEGER NOT NULL,
        notified INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_seen_first_seen ON seen_status_hashes(first_seen_at);

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY NOT NULL,
        category TEXT NOT NULL,
        text TEXT NOT NULL,
        bg_style TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
    `,
  },
];

/** The schema version this build expects (highest migration). */
export const LATEST_VERSION = MIGRATIONS.reduce(
  (max, m) => Math.max(max, m.version),
  0,
);

async function getUserVersion(db: SqliteAdapter): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  return row?.user_version ?? 0;
}

/**
 * Applies every migration whose version is above the current `user_version`.
 * Safe to call on every launch — already-applied migrations are skipped, and
 * the DDL is `IF NOT EXISTS` so a partial state still converges.
 */
export async function runMigrations(db: SqliteAdapter): Promise<void> {
  const ordered = [...MIGRATIONS].sort((a, b) => a.version - b.version);
  let current = await getUserVersion(db);

  for (const migration of ordered) {
    if (migration.version <= current) {
      continue;
    }
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
    });
    // PRAGMA user_version cannot be parameterised; version is an integer literal.
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }
}
