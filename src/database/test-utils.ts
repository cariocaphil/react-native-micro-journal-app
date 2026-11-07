/// <reference types="node" />
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import { openJournalDatabase } from './database';

function createTempDatabasePath(label: string): string {
  return path.join(
    os.tmpdir(),
    `micro-journal-${label}-${process.env.JEST_WORKER_ID ?? '0'}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.db`,
  );
}

function deleteDatabaseFiles(filePath: string): void {
  for (const suffix of ['', '-wal', '-shm']) {
    const candidate = `${filePath}${suffix}`;
    if (fs.existsSync(candidate)) {
      fs.unlinkSync(candidate);
    }
  }
}

/**
 * Opens an isolated on-disk SQLite DB for Jest.
 * expo-sqlite-mock routes all connections through EXPO_SQLITE_MOCK (better-sqlite3),
 * so a shared file path is required for withExclusiveTransactionAsync secondary connections.
 */
export async function openTestJournalDatabase(
  label: string,
): Promise<{ db: SQLiteDatabase; cleanup: () => Promise<void> }> {
  const filePath = createTempDatabasePath(label);

  process.env.EXPO_SQLITE_MOCK = filePath;

  // useNewConnection skips Expo SQLite DevTools registration (noisy / leaky under Jest).
  const db = await openJournalDatabase(filePath, { useNewConnection: true });

  const cleanup = async () => {
    try {
      await db.closeAsync();
    } catch {
      // ignore close errors during cleanup
    }
    delete process.env.EXPO_SQLITE_MOCK;
    deleteDatabaseFiles(filePath);
  };

  return { db, cleanup };
}

export type ReopenableTestJournalDatabase = {
  /** Current open connection. Replaced after {@link reopen}. */
  db: SQLiteDatabase;
  /** Absolute on-disk path used for this database. */
  filePath: string;
  /** Closes the current connection without deleting the file. */
  close: () => Promise<void>;
  /** Opens a new connection to the same file path (proves file-backed persistence). */
  reopen: () => Promise<SQLiteDatabase>;
  /** Closes any open connection and deletes the database files. */
  cleanup: () => Promise<void>;
};

/**
 * File-backed SQLite session that can be closed and reopened at the same path.
 * Use this to prove data survives a real database restart — not merely repository recreation.
 */
export async function openReopenableTestJournalDatabase(
  label: string,
): Promise<ReopenableTestJournalDatabase> {
  const filePath = createTempDatabasePath(label);
  process.env.EXPO_SQLITE_MOCK = filePath;

  let db = await openJournalDatabase(filePath, { useNewConnection: true });
  let isOpen = true;

  const close = async () => {
    if (!isOpen) {
      return;
    }
    await db.closeAsync();
    isOpen = false;
  };

  const reopen = async () => {
    if (isOpen) {
      await close();
    }
    process.env.EXPO_SQLITE_MOCK = filePath;
    db = await openJournalDatabase(filePath, { useNewConnection: true });
    isOpen = true;
    session.db = db;
    return db;
  };

  const cleanup = async () => {
    if (isOpen) {
      try {
        await db.closeAsync();
      } catch {
        // ignore close errors during cleanup
      }
      isOpen = false;
    }
    delete process.env.EXPO_SQLITE_MOCK;
    deleteDatabaseFiles(filePath);
  };

  const session: ReopenableTestJournalDatabase = {
    db,
    filePath,
    close,
    reopen,
    cleanup,
  };

  return session;
}
