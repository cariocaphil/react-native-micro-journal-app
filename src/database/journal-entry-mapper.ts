import { JournalEntrySchema, type JournalEntry } from '@/domain/journal/journal-entry';

/** Snake_case shape returned by SQLite for journal_entries rows. */
export type JournalEntryRow = {
  id: string;
  content: string;
  mood: string;
  created_at: string;
  updated_at: string;
};

/**
 * Maps a database row to a validated domain JournalEntry.
 * Throws if the persisted row fails domain validation.
 */
export function mapRowToJournalEntry(row: JournalEntryRow): JournalEntry {
  const result = JournalEntrySchema.safeParse({
    id: row.id,
    content: row.content,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Malformed journal entry row "${row.id}": ${details}`);
  }

  return result.data;
}
