/**
 * Minimal async SQLite interface the db layer talks to. Production is backed by
 * expo-sqlite (see `expoAdapter.ts`); tests inject a better-sqlite3 adapter.
 * Keeping the surface tiny lets both back-ends implement it faithfully.
 */
export type SqlValue = string | number | null;

export type RunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface SqliteAdapter {
  /** Execute one or more statements with no parameters (DDL, PRAGMAs). */
  execAsync(sql: string): Promise<void>;
  /** Execute a single write statement with positional params. */
  runAsync(sql: string, params?: SqlValue[]): Promise<RunResult>;
  /** Read all rows for a query. */
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** Read the first row (or null) for a query. */
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /** Run `task` inside a transaction, rolling back if it throws. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
