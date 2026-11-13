import type { JournalRepository } from '@/database/journal-repository';
import {
  UpdateJournalEntrySchema,
  type JournalEntry,
  type Mood,
} from '@/domain/journal/journal-entry';
import {
  mapCreateEntryFieldErrors,
  PERSISTENCE_ERROR_MESSAGE,
  type NewEntryFieldErrors,
} from '@/journal/new-entry-submit';

export type EditEntryFieldErrors = NewEntryFieldErrors;

export type SubmitUpdateJournalEntryResult =
  | { status: 'success'; entry: JournalEntry }
  | { status: 'validation'; fieldErrors: EditEntryFieldErrors }
  | { status: 'persistence'; message: string }
  | { status: 'notFound' };

export { PERSISTENCE_ERROR_MESSAGE };

export const ENTRY_GONE_MESSAGE = 'This entry could not be found.';

type EditEntryFormInput = {
  content: string;
  mood: Mood;
};

export async function submitUpdateJournalEntry(
  repository: JournalRepository,
  id: string,
  input: EditEntryFormInput,
): Promise<SubmitUpdateJournalEntryResult> {
  const parsed = UpdateJournalEntrySchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 'validation',
      // UpdateJournalEntrySchema is CreateJournalEntrySchema; field mapping is shared.
      fieldErrors: mapCreateEntryFieldErrors(parsed.error),
    };
  }

  try {
    const entry = await repository.update(id, parsed.data);
    if (!entry) {
      return { status: 'notFound' };
    }
    return { status: 'success', entry };
  } catch {
    return {
      status: 'persistence',
      message: PERSISTENCE_ERROR_MESSAGE,
    };
  }
}
