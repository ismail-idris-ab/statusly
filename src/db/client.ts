import * as SQLite from 'expo-sqlite';

import type { SqliteAdapter } from './adapter';
import { createExpoAdapter } from './expoAdapter';
import { runMigrations } from './migrations';
import { loadSeedQuotes, seedQuotes } from './seed';

const DB_NAME = 'statusly.db';

let dbPromise: Promise<SqliteAdapter> | null = null;

async function initialize(): Promise<SqliteAdapter> {
  const sqlite = await SQLite.openDatabaseAsync(DB_NAME);
  // WAL improves concurrent read/write performance for the saved-items index.
  await sqlite.execAsync('PRAGMA journal_mode = WAL;');
  const db = createExpoAdapter(sqlite);
  await runMigrations(db);
  await seedQuotes(db, loadSeedQuotes());
  return db;
}

/**
 * Returns the singleton database, initializing it (open → migrate → seed) on
 * first call. The promise is cached so concurrent callers share one init.
 */
export function getDatabase(): Promise<SqliteAdapter> {
  if (!dbPromise) {
    dbPromise = initialize();
  }
  return dbPromise;
}
