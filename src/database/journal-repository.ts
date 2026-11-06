import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreateJournalEntrySchema,
  UpdateJournalEntrySchema,
  type CreateJournalEntryInput,
  type JournalEntry,
  type UpdateJournalEntryInput,
} from '@/domain/journal/journal-entry';

import { mapRowToJournalEntry } from './journal-entry-mapper';
import {
  deleteJournalEntryRow,
  fetchAllJournalEntryRows,
  fetchJournalEntryRowById,
  insertJournalEntryRow,
  updateJournalEntryRow,
} from './journal-entry-queries';

export type JournalRepository = {
  create(input: CreateJournalEntryInput): Promise<JournalEntry>;
  findById(id: string): Promise<JournalEntry | null>;
  findAll(): Promise<JournalEntry[]>;
  update(id: string, input: UpdateJournalEntryInput): Promise<JournalEntry | null>;
  delete(id: string): Promise<boolean>;
};

export type JournalRepositoryOptions = {
  /** Defaults to expo-crypto randomUUID. Injectable for deterministic tests. */
  createId?: () => string;
  /** Defaults to new Date().toISOString(). Injectable for deterministic tests. */
  now?: () => string;
};

export function createJournalRepository(
  db: SQLiteDatabase,
  options: JournalRepositoryOptions = {},
): JournalRepository {
  const createId = options.createId ?? (() => Crypto.randomUUID());
  const now = options.now ?? (() => new Date().toISOString());

  async function findById(id: string): Promise<JournalEntry | null> {
    const row = await fetchJournalEntryRowById(db, id);
    return row ? mapRowToJournalEntry(row) : null;
  }

  return {
    async create(input) {
      const parsed = CreateJournalEntrySchema.parse(input);
      const id = createId();
      const timestamp = now();

      await insertJournalEntryRow(db, {
        id,
        content: parsed.content,
        mood: parsed.mood,
        created_at: timestamp,
        updated_at: timestamp,
      });

      const entry = await findById(id);
      if (!entry) {
        throw new Error(`Failed to read journal entry after create: ${id}`);
      }
      return entry;
    },

    findById,

    async findAll() {
      const rows = await fetchAllJournalEntryRows(db);
      return rows.map(mapRowToJournalEntry);
    },

    async update(id, input) {
      const parsed = UpdateJournalEntrySchema.parse(input);
      const changes = await updateJournalEntryRow(db, id, {
        content: parsed.content,
        mood: parsed.mood,
        updated_at: now(),
      });

      if (changes === 0) {
        return null;
      }

      return findById(id);
    },

    async delete(id) {
      const changes = await deleteJournalEntryRow(db, id);
      return changes > 0;
    },
  };
}
