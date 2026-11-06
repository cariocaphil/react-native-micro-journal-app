import { describe, expect, it } from '@jest/globals';

import { openJournalDatabase } from './database';
import { applyMigrations, LATEST_SCHEMA_VERSION, MIGRATIONS } from './migrations';
import { openTestJournalDatabase } from './test-utils';

describe('openJournalDatabase / migrations', () => {
  it('creates the journal_entries schema and sets user_version on a fresh database', async () => {
    const { db, cleanup } = await openTestJournalDatabase('fresh');

    try {
      const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      expect(version?.user_version).toBe(LATEST_SCHEMA_VERSION);

      const table = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'journal_entries'`,
      );
      expect(table?.name).toBe('journal_entries');

      const index = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_journal_entries_created_at'`,
      );
      expect(index?.name).toBe('idx_journal_entries_created_at');
    } finally {
      await cleanup();
    }
  });

  it('does not destroy existing data when initialization is repeated', async () => {
    const { db, cleanup } = await openTestJournalDatabase('reinit');
    const filePath = process.env.EXPO_SQLITE_MOCK;

    try {
      await db.runAsync(
        `INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        'entry-1',
        'Keep me',
        'good',
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000Z',
      );
      await db.closeAsync();

      expect(filePath).toBeTruthy();
      process.env.EXPO_SQLITE_MOCK = filePath;
      const reopened = await openJournalDatabase(filePath!, { useNewConnection: true });

      try {
        const version = await reopened.getFirstAsync<{ user_version: number }>(
          'PRAGMA user_version',
        );
        expect(version?.user_version).toBe(LATEST_SCHEMA_VERSION);

        const row = await reopened.getFirstAsync<{ content: string }>(
          `SELECT content FROM journal_entries WHERE id = ?`,
          'entry-1',
        );
        expect(row?.content).toBe('Keep me');
      } finally {
        await reopened.closeAsync();
      }
    } finally {
      await cleanup();
    }
  });

  it('rolls back applyMigrations and leaves user_version unchanged on failure', async () => {
    const { db, cleanup } = await openTestJournalDatabase('migrate-fail');

    try {
      const before = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      expect(before?.user_version).toBe(LATEST_SCHEMA_VERSION);

      await expect(
        applyMigrations(db, [
          ...MIGRATIONS,
          {
            version: LATEST_SCHEMA_VERSION + 1,
            up: async (txn) => {
              await txn.execAsync('CREATE TABLE migration_probe (id TEXT)');
              await txn.execAsync('THIS IS NOT VALID SQL');
            },
          },
        ]),
      ).rejects.toThrow();

      const after = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      expect(after?.user_version).toBe(LATEST_SCHEMA_VERSION);

      const probe = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'migration_probe'`,
      );
      expect(probe).toBeNull();
    } finally {
      await cleanup();
    }
  });
});
