import { describe, expect, it, jest } from '@jest/globals';

import type { JournalRepository } from '@/database/journal-repository';
import type { JournalEntry } from '@/domain/journal/journal-entry';

import {
  ENTRY_GONE_MESSAGE,
  PERSISTENCE_ERROR_MESSAGE,
  submitUpdateJournalEntry,
} from './edit-entry-submit';

const updatedEntry: JournalEntry = {
  id: 'entry-1',
  content: 'Updated reflection',
  mood: 'great',
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

function createMockRepository(
  updateImpl?: JournalRepository['update'],
): JournalRepository {
  return {
    create: jest.fn(async () => updatedEntry) as JournalRepository['create'],
    findById: jest.fn(async () => updatedEntry) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: (updateImpl ??
      jest.fn(async () => updatedEntry)) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

describe('submitUpdateJournalEntry', () => {
  it('persists a valid entry with normalized content', async () => {
    const repository = createMockRepository();

    const result = await submitUpdateJournalEntry(repository, 'entry-1', {
      content: '  Updated reflection  ',
      mood: 'great',
    });

    expect(result).toEqual({ status: 'success', entry: updatedEntry });
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith('entry-1', {
      content: 'Updated reflection',
      mood: 'great',
    });
  });

  it('does not call update when content is empty', async () => {
    const repository = createMockRepository();

    const result = await submitUpdateJournalEntry(repository, 'entry-1', {
      content: '',
      mood: 'good',
    });

    expect(result.status).toBe('validation');
    if (result.status === 'validation') {
      expect(result.fieldErrors.content).toBe('Enter a journal entry.');
    }
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns notFound when update returns null', async () => {
    const repository = createMockRepository(
      jest.fn(async () => null) as JournalRepository['update'],
    );

    const result = await submitUpdateJournalEntry(repository, 'missing', {
      content: 'Still here',
      mood: 'okay',
    });

    expect(result).toEqual({ status: 'notFound' });
    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(result).not.toEqual(
      expect.objectContaining({
        status: 'persistence',
        message: PERSISTENCE_ERROR_MESSAGE,
      }),
    );
    expect(ENTRY_GONE_MESSAGE).toBe('This entry could not be found.');
  });

  it('returns a persistence error when update rejects', async () => {
    const repository = createMockRepository(
      jest.fn(async () => {
        throw new Error('disk full');
      }) as JournalRepository['update'],
    );

    const result = await submitUpdateJournalEntry(repository, 'entry-1', {
      content: 'Updated reflection',
      mood: 'great',
    });

    expect(result).toEqual({
      status: 'persistence',
      message: PERSISTENCE_ERROR_MESSAGE,
    });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });
});
