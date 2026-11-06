import { describe, expect, it, jest } from '@jest/globals';

import type { JournalRepository } from '@/database/journal-repository';
import type { JournalEntry } from '@/domain/journal/journal-entry';

import {
  PERSISTENCE_ERROR_MESSAGE,
  submitNewJournalEntry,
} from './new-entry-submit';

const createdEntry: JournalEntry = {
  id: 'entry-1',
  content: 'Hello journal',
  mood: 'okay',
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-15T10:00:00.000Z',
};

function createMockRepository(
  createImpl?: JournalRepository['create'],
): JournalRepository {
  return {
    create: createImpl ?? (jest.fn(async () => createdEntry) as JournalRepository['create']),
    findById: jest.fn(async () => null) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

describe('submitNewJournalEntry', () => {
  it('persists a valid entry with normalized content', async () => {
    const repository = createMockRepository();

    const result = await submitNewJournalEntry(repository, {
      content: '  Hello journal  ',
      mood: 'okay',
    });

    expect(result).toEqual({ status: 'success', entry: createdEntry });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({
      content: 'Hello journal',
      mood: 'okay',
    });
  });

  it('does not call create when content is empty', async () => {
    const repository = createMockRepository();

    const result = await submitNewJournalEntry(repository, {
      content: '',
      mood: 'good',
    });

    expect(result.status).toBe('validation');
    if (result.status === 'validation') {
      expect(result.fieldErrors.content).toBe('Enter a journal entry.');
    }
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('does not call create when content is whitespace-only', async () => {
    const repository = createMockRepository();

    const result = await submitNewJournalEntry(repository, {
      content: '   \n\t  ',
      mood: 'good',
    });

    expect(result.status).toBe('validation');
    if (result.status === 'validation') {
      expect(result.fieldErrors.content).toBe('Enter a journal entry.');
    }
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns a persistence error when create rejects', async () => {
    const repository = createMockRepository(
      jest.fn(async () => {
        throw new Error('disk full');
      }) as JournalRepository['create'],
    );

    const result = await submitNewJournalEntry(repository, {
      content: 'A short reflection.',
      mood: 'great',
    });

    expect(result).toEqual({
      status: 'persistence',
      message: PERSISTENCE_ERROR_MESSAGE,
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
