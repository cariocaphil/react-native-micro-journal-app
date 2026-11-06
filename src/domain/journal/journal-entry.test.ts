import { describe, expect, it } from '@jest/globals';

import {
  CreateJournalEntrySchema,
  JournalEntrySchema,
  MOODS,
  type CreateJournalEntryInput,
  type JournalEntry,
} from './journal-entry';

const CREATED_AT = '2024-06-15T10:00:00.000Z';
const UPDATED_AT = '2024-06-15T12:00:00.000Z';

const validEntry: JournalEntry = {
  id: 'entry-1',
  content: 'A short reflection.',
  mood: 'good',
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

const validCreateInput: CreateJournalEntryInput = {
  content: 'A short reflection.',
  mood: 'good',
};

describe('CreateJournalEntrySchema', () => {
  it('accepts valid creation input', () => {
    const result = CreateJournalEntrySchema.safeParse(validCreateInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCreateInput);
    }
  });

  it('trims content whitespace', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: '  Hello journal  ',
      mood: 'okay',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('Hello journal');
    }
  });

  it.each(MOODS)('accepts mood %s', (mood) => {
    const result = CreateJournalEntrySchema.safeParse({
      content: 'Mood check',
      mood,
    });

    expect(result.success).toBe(true);
  });

  it('accepts content at the maximum length of 500 characters', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: 'a'.repeat(500),
      mood: 'great',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: '',
      mood: 'good',
    });

    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only content', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: '   \n\t  ',
      mood: 'good',
    });

    expect(result.success).toBe(false);
  });

  it('rejects content longer than 500 characters', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: 'a'.repeat(501),
      mood: 'good',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported mood', () => {
    const result = CreateJournalEntrySchema.safeParse({
      content: 'Hello',
      mood: 'fantastic',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(CreateJournalEntrySchema.safeParse({}).success).toBe(false);
    expect(CreateJournalEntrySchema.safeParse({ content: 'Only content' }).success).toBe(false);
    expect(CreateJournalEntrySchema.safeParse({ mood: 'good' }).success).toBe(false);
  });
});

describe('JournalEntrySchema', () => {
  it('accepts a valid journal entry', () => {
    const result = JournalEntrySchema.safeParse(validEntry);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validEntry);
    }
  });

  it.each(MOODS)('accepts mood %s on a full entry', (mood) => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      mood,
    });

    expect(result.success).toBe(true);
  });

  it('accepts content at the maximum length of 500 characters', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      content: 'b'.repeat(500),
    });

    expect(result.success).toBe(true);
  });

  it('accepts equal createdAt and updatedAt', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      updatedAt: CREATED_AT,
    });

    expect(result.success).toBe(true);
  });

  it('treats equal instants with different timezone offsets as valid', () => {
    // 12:00+02:00 and 10:00Z are the same instant
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      createdAt: '2024-06-15T10:00:00.000Z',
      updatedAt: '2024-06-15T12:00:00.000+02:00',
    });

    expect(result.success).toBe(true);
  });

  it('rejects updatedAt that is earlier across timezone offsets', () => {
    // 11:00+02:00 is 09:00Z, which precedes 10:00Z
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      createdAt: '2024-06-15T10:00:00.000Z',
      updatedAt: '2024-06-15T11:00:00.000+02:00',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty id', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      id: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      content: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only content', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      content: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects content longer than 500 characters', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      content: 'c'.repeat(501),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported mood', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      mood: 'meh',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(JournalEntrySchema.safeParse({}).success).toBe(false);
    expect(
      JournalEntrySchema.safeParse({
        content: 'x',
        mood: 'good',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      }).success,
    ).toBe(false);
  });

  it('rejects invalid timestamps', () => {
    expect(
      JournalEntrySchema.safeParse({
        ...validEntry,
        createdAt: 'not-a-date',
      }).success,
    ).toBe(false);

    expect(
      JournalEntrySchema.safeParse({
        ...validEntry,
        updatedAt: '2024-06-15',
      }).success,
    ).toBe(false);
  });

  it('rejects updatedAt earlier than createdAt', () => {
    const result = JournalEntrySchema.safeParse({
      ...validEntry,
      createdAt: '2024-06-15T12:00:00.000Z',
      updatedAt: '2024-06-15T10:00:00.000Z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['updatedAt']);
    }
  });
});
