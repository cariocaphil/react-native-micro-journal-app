import { describe, expect, it, jest } from '@jest/globals';

import type { JournalRepository } from '@/database/journal-repository';
import {
  CreateJournalEntrySchema,
  type JournalEntry,
} from '@/domain/journal/journal-entry';

import {
  mapCreateEntryFieldErrors,
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

describe('mapCreateEntryFieldErrors', () => {
  it('maps empty content to a friendly message', () => {
    const parsed = CreateJournalEntrySchema.safeParse({ content: '', mood: 'good' });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(mapCreateEntryFieldErrors(parsed.error)).toEqual({
      content: 'Enter a journal entry.',
    });
  });

  it('keeps the schema message for content that is too long', () => {
    const parsed = CreateJournalEntrySchema.safeParse({
      content: 'a'.repeat(501),
      mood: 'good',
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const fieldErrors = mapCreateEntryFieldErrors(parsed.error);
    expect(fieldErrors.content).toBe(parsed.error.issues[0]?.message);
  });

  it('maps an invalid mood to a friendly message', () => {
    const parsed = CreateJournalEntrySchema.safeParse({
      content: 'A short reflection.',
      mood: 'ecstatic',
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(mapCreateEntryFieldErrors(parsed.error)).toEqual({
      mood: 'Select a mood.',
    });
  });
});

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

  it('does not call create when content exceeds the schema max length', async () => {
    const repository = createMockRepository();

    const result = await submitNewJournalEntry(repository, {
      content: 'a'.repeat(501),
      mood: 'okay',
    });

    expect(result.status).toBe('validation');
    if (result.status === 'validation') {
      expect(result.fieldErrors.content).toBeTruthy();
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
