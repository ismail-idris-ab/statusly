import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

import type { SqliteAdapter, SqlValue } from '@/db/adapter';

/**
 * Test-only {@link SqliteAdapter} backed by sql.js (SQLite compiled to WASM).
 * Pure JS — no native build — so CRUD/migration tests run anywhere. Production
 * uses expo-sqlite via `createExpoAdapter`.
 */
let sqlPromise: ReturnType<typeof initSqlJs> | null = null;

function loadSqlJs() {
  if (!sqlPromise) {
    // In Node/Jest, sql.js locates its bundled `sql-wasm.wasm` from its own
    // dist directory, so no `locateFile` override is needed.
    sqlPromise = initSqlJs();
  }
  return sqlPromise;
}

function createAdapter(db: SqlJsDatabase): SqliteAdapter {
  return {
    async execAsync(sql: string): Promise<void> {
      // Without params, sql.js runs every statement in the string (DDL blocks).
      db.run(sql);
    },
    async runAsync(sql: string, params: SqlValue[] = []) {
      db.run(sql, params);
      const changes = db.getRowsModified();
      const result = db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowId = Number(result[0]?.values[0]?.[0] ?? 0);
      return { changes, lastInsertRowId };
    },
    async getAllAsync<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as T);
        }
        return rows;
      } finally {
        stmt.free();
      }
    },
    async getFirstAsync<T>(
      sql: string,
      params: SqlValue[] = [],
    ): Promise<T | null> {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        return stmt.step() ? (stmt.getAsObject() as T) : null;
      } finally {
        stmt.free();
      }
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      db.run('BEGIN');
      try {
        await task();
        db.run('COMMIT');
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    },
  };
}

/** Fresh in-memory database adapter for a single test. */
export async function createTestDatabase(): Promise<SqliteAdapter> {
  const SQL = await loadSqlJs();
  return createAdapter(new SQL.Database());
}
