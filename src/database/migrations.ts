import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL,
  mood TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_journal_entries_created_at ON journal_entries (created_at DESC);
`);
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;

/**
 * Apply pending migrations inside an exclusive transaction.
 * All statements (including PRAGMA user_version) run on the txn connection.
 *
 * `migrations` is injectable for tests that need to simulate a failing upgrade.
 */
export async function applyMigrations(
  db: SQLiteDatabase,
  migrations: Migration[] = MIGRATIONS,
): Promise<void> {
  const latestVersion = migrations[migrations.length - 1]?.version ?? 0;
  const currentRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = currentRow?.user_version ?? 0;

  if (currentVersion >= latestVersion) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    const txnRow = await txn.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = txnRow?.user_version ?? 0;

    for (const migration of migrations) {
      if (migration.version <= version) {
        continue;
      }

      await migration.up(txn);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
      version = migration.version;
    }
  });
}
