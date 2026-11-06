import type { SQLiteDatabase } from 'expo-sqlite';

import type { JournalEntryRow } from './journal-entry-mapper';

export const JOURNAL_ENTRY_COLUMNS = 'id, content, mood, created_at, updated_at';

export async function fetchJournalEntryRowById(
  db: SQLiteDatabase,
  id: string,
): Promise<JournalEntryRow | null> {
  return db.getFirstAsync<JournalEntryRow>(
    `SELECT ${JOURNAL_ENTRY_COLUMNS}
     FROM journal_entries
     WHERE id = ?`,
    id,
  );
}

export async function fetchAllJournalEntryRows(db: SQLiteDatabase): Promise<JournalEntryRow[]> {
  return db.getAllAsync<JournalEntryRow>(
    `SELECT ${JOURNAL_ENTRY_COLUMNS}
     FROM journal_entries
     ORDER BY created_at DESC, id DESC`,
  );
}

export async function insertJournalEntryRow(
  db: SQLiteDatabase,
  row: JournalEntryRow,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    row.id,
    row.content,
    row.mood,
    row.created_at,
    row.updated_at,
  );
}

export async function updateJournalEntryRow(
  db: SQLiteDatabase,
  id: string,
  fields: { content: string; mood: string; updated_at: string },
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE journal_entries
     SET content = ?, mood = ?, updated_at = ?
     WHERE id = ?`,
    fields.content,
    fields.mood,
    fields.updated_at,
    id,
  );

  return result.changes;
}

export async function deleteJournalEntryRow(db: SQLiteDatabase, id: string): Promise<number> {
  const result = await db.runAsync(`DELETE FROM journal_entries WHERE id = ?`, id);
  return result.changes;
}
