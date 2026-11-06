/// <reference types="node" />
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';

import { openJournalDatabase } from './database';

/**
 * Opens an isolated on-disk SQLite DB for Jest.
 * expo-sqlite-mock routes all connections through EXPO_SQLITE_MOCK (better-sqlite3),
 * so a shared file path is required for withExclusiveTransactionAsync secondary connections.
 */
export async function openTestJournalDatabase(
  label: string,
): Promise<{ db: SQLiteDatabase; cleanup: () => Promise<void> }> {
  const filePath = path.join(
    os.tmpdir(),
    `micro-journal-${label}-${process.env.JEST_WORKER_ID ?? '0'}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.db`,
  );

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
    for (const suffix of ['', '-wal', '-shm']) {
      const candidate = `${filePath}${suffix}`;
      if (fs.existsSync(candidate)) {
        fs.unlinkSync(candidate);
      }
    }
  };

  return { db, cleanup };
}
