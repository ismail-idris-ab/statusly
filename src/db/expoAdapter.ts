import type { SQLiteDatabase } from 'expo-sqlite';

import type { RunResult, SqliteAdapter, SqlValue } from './adapter';

/**
 * Wraps an expo-sqlite database as a {@link SqliteAdapter}. This is the only
 * place production code touches the expo-sqlite API directly.
 */
export function createExpoAdapter(db: SQLiteDatabase): SqliteAdapter {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params = []): Promise<RunResult> => {
      const result = await db.runAsync(sql, params as SqlValue[]);
      return {
        changes: result.changes,
        lastInsertRowId: result.lastInsertRowId,
      };
    },
    getAllAsync: <T>(sql: string, params: SqlValue[] = []) =>
      db.getAllAsync<T>(sql, params),
    getFirstAsync: <T>(sql: string, params: SqlValue[] = []) =>
      db.getFirstAsync<T>(sql, params),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
  };
}
