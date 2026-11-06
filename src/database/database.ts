import * as SQLite from 'expo-sqlite';

import { applyMigrations } from './migrations';

export const DEFAULT_DATABASE_NAME = 'micro-journal.db';

/**
 * Opens the journal SQLite database, enables WAL, and runs schema migrations.
 * Safe to call repeatedly on an existing database file (migrations are versioned).
 */
export async function openJournalDatabase(
  databaseName: string = DEFAULT_DATABASE_NAME,
  options?: SQLite.SQLiteOpenOptions,
): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(databaseName, options);

  await db.execAsync('PRAGMA journal_mode = WAL');
  await applyMigrations(db);

  return db;
}
