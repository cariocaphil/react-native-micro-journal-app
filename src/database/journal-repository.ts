import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  CreateJournalEntrySchema,
  UpdateJournalEntrySchema,
  type CreateJournalEntryInput,
  type JournalEntry,
  type UpdateJournalEntryInput,
} from '@/domain/journal/journal-entry';

import { mapRowToJournalEntry, type JournalEntryRow } from './journal-entry-mapper';

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
    const row = await db.getFirstAsync<JournalEntryRow>(
      `SELECT id, content, mood, created_at, updated_at
       FROM journal_entries
       WHERE id = ?`,
      id,
    );

    if (!row) {
      return null;
    }

    return mapRowToJournalEntry(row);
  }

  return {
    async create(input) {
      const parsed = CreateJournalEntrySchema.parse(input);
      const id = createId();
      const timestamp = now();

      await db.runAsync(
        `INSERT INTO journal_entries (id, content, mood, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        id,
        parsed.content,
        parsed.mood,
        timestamp,
        timestamp,
      );

      const entry = await findById(id);
      if (!entry) {
        throw new Error(`Failed to read journal entry after create: ${id}`);
      }
      return entry;
    },

    findById,

    async findAll() {
      const rows = await db.getAllAsync<JournalEntryRow>(
        `SELECT id, content, mood, created_at, updated_at
         FROM journal_entries
         ORDER BY created_at DESC, id DESC`,
      );

      return rows.map(mapRowToJournalEntry);
    },

    async update(id, input) {
      const parsed = UpdateJournalEntrySchema.parse(input);
      const updatedAt = now();

      const result = await db.runAsync(
        `UPDATE journal_entries
         SET content = ?, mood = ?, updated_at = ?
         WHERE id = ?`,
        parsed.content,
        parsed.mood,
        updatedAt,
        id,
      );

      if (result.changes === 0) {
        return null;
      }

      return findById(id);
    },

    async delete(id) {
      const result = await db.runAsync(`DELETE FROM journal_entries WHERE id = ?`, id);
      return result.changes > 0;
    },
  };
}
