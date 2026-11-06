import type { z } from 'zod';

import type { JournalRepository } from '@/database/journal-repository';
import {
  CreateJournalEntrySchema,
  type CreateJournalEntryInput,
  type JournalEntry,
  type Mood,
} from '@/domain/journal/journal-entry';

export type NewEntryFieldErrors = {
  content?: string;
  mood?: string;
};

export type SubmitNewJournalEntryResult =
  | { status: 'success'; entry: JournalEntry }
  | { status: 'validation'; fieldErrors: NewEntryFieldErrors }
  | { status: 'persistence'; message: string };

export const PERSISTENCE_ERROR_MESSAGE = "Couldn't save your entry. Please try again.";

type NewEntryFormInput = {
  content: string;
  mood: Mood;
};

function messageForIssue(issue: z.core.$ZodIssue, field: keyof NewEntryFieldErrors): string {
  switch (issue.code) {
    case 'too_small':
      return field === 'content' ? 'Enter a journal entry.' : 'Select a mood.';
    case 'invalid_value':
    case 'invalid_type':
      return field === 'mood' ? 'Select a mood.' : issue.message;
    default:
      // Prefer the schema/Zod message (e.g. too_big includes the max length from the schema).
      return issue.message;
  }
}

export function mapCreateEntryFieldErrors(
  error: z.ZodError<CreateJournalEntryInput>,
): NewEntryFieldErrors {
  const fieldErrors: NewEntryFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field !== 'content' && field !== 'mood') {
      continue;
    }
    if (fieldErrors[field]) {
      continue;
    }
    fieldErrors[field] = messageForIssue(issue, field);
  }

  return fieldErrors;
}

export async function submitNewJournalEntry(
  repository: JournalRepository,
  input: NewEntryFormInput,
): Promise<SubmitNewJournalEntryResult> {
  const parsed = CreateJournalEntrySchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 'validation',
      fieldErrors: mapCreateEntryFieldErrors(parsed.error),
    };
  }

  try {
    const entry = await repository.create(parsed.data);
    return { status: 'success', entry };
  } catch {
    return {
      status: 'persistence',
      message: PERSISTENCE_ERROR_MESSAGE,
    };
  }
}
