import { describe, expect, it } from '@jest/globals';

import { createJournalRepository } from './journal-repository';
import { openTestJournalDatabase } from './test-utils';

const T0 = '2024-06-15T10:00:00.000Z';
const T1 = '2024-06-15T11:00:00.000Z';
const T2 = '2024-06-15T12:00:00.000Z';

describe('JournalRepository', () => {
  it('creates and retrieves an entry', async () => {
    const { db, cleanup } = await openTestJournalDatabase('create');

    try {
      const repo = createJournalRepository(db, {
        createId: () => 'id-1',
        now: () => T0,
      });

      const created = await repo.create({ content: 'Hello journal', mood: 'great' });
      expect(created).toEqual({
        id: 'id-1',
        content: 'Hello journal',
        mood: 'great',
        createdAt: T0,
        updatedAt: T0,
      });

      const found = await repo.findById('id-1');
      expect(found).toEqual(created);
    } finally {
      await cleanup();
    }
  });

  it('returns entries in descending created_at order with deterministic id ties', async () => {
    const { db, cleanup } = await openTestJournalDatabase('order');

    try {
      let idSeq = 0;
      const timestamps = [T0, T1, T1];
      let timeIndex = 0;

      const repo = createJournalRepository(db, {
        createId: () => `id-${++idSeq}`,
        now: () => timestamps[timeIndex++] ?? T2,
      });

      await repo.create({ content: 'oldest', mood: 'okay' }); // T0, id-1
      await repo.create({ content: 'mid-a', mood: 'good' }); // T1, id-2
      await repo.create({ content: 'mid-b', mood: 'bad' }); // T1, id-3

      const all = await repo.findAll();
      expect(all.map((entry) => entry.id)).toEqual(['id-3', 'id-2', 'id-1']);
      expect(all.map((entry) => entry.content)).toEqual(['mid-b', 'mid-a', 'oldest']);
    } finally {
      await cleanup();
    }
  });

  it('updates content and mood while preserving createdAt', async () => {
    const { db, cleanup } = await openTestJournalDatabase('update');

    try {
      let tick = 0;
      const times = [T0, T1];
      const repo = createJournalRepository(db, {
        createId: () => 'id-update',
        now: () => times[tick++] ?? T2,
      });

      await repo.create({ content: 'Before', mood: 'okay' });
      const updated = await repo.update('id-update', { content: 'After', mood: 'awful' });

      expect(updated).toEqual({
        id: 'id-update',
        content: 'After',
        mood: 'awful',
        createdAt: T0,
        updatedAt: T1,
      });
    } finally {
      await cleanup();
    }
  });

  it('deletes an entry and reports missing ids', async () => {
    const { db, cleanup } = await openTestJournalDatabase('delete');

    try {
      const repo = createJournalRepository(db, {
        createId: () => 'id-del',
        now: () => T0,
      });

      await repo.create({ content: 'Gone soon', mood: 'good' });
      expect(await repo.delete('id-del')).toBe(true);
      expect(await repo.findById('id-del')).toBeNull();
      expect(await repo.delete('id-del')).toBe(false);
      expect(await repo.update('missing', { content: 'x', mood: 'good' })).toBeNull();
      expect(await repo.findById('missing')).toBeNull();
    } finally {
      await cleanup();
    }
  });

  it('rejects invalid create and update input', async () => {
    const { db, cleanup } = await openTestJournalDatabase('invalid');

    try {
      const repo = createJournalRepository(db, {
        createId: () => 'id-invalid',
        now: () => T0,
      });

      await expect(repo.create({ content: '   ', mood: 'good' })).rejects.toThrow();
      await expect(
        repo.create({ content: 'ok', mood: 'fantastic' as 'good' }),
      ).rejects.toThrow();

      await repo.create({ content: 'valid', mood: 'good' });
      await expect(repo.update('id-invalid', { content: '', mood: 'good' })).rejects.toThrow();
    } finally {
      await cleanup();
    }
  });

  it('round-trips content with quotes and special characters', async () => {
    const { db, cleanup } = await openTestJournalDatabase('special');

    try {
      const content = `He said "hello"; O'Brien & co.\nLine 2\t👍`;
      const repo = createJournalRepository(db, {
        createId: () => 'id-special',
        now: () => T0,
      });

      const created = await repo.create({ content, mood: 'okay' });
      expect(created.content).toBe(content);

      const found = await repo.findById('id-special');
      expect(found?.content).toBe(content);
    } finally {
      await cleanup();
    }
  });
});
