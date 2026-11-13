import { useQuery } from '@tanstack/react-query';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { normalizeEntryId } from '@/hooks/normalize-entry-id';
import { journalKeys } from '@/journal/journal-query-keys';

export const LOAD_ENTRY_ERROR_MESSAGE = "Couldn't load this entry. Please try again.";

export type UseJournalEntryDetailResult = {
  entry: JournalEntry | null;
  status: JournalEntryDetailStatus;
  reload: () => void;
};

export function useJournalEntryDetail(
  rawId: string | string[] | undefined,
): UseJournalEntryDetailResult {
  const repository = useReadyJournalRepository();
  const id = normalizeEntryId(rawId);
  const enabled = id != null;

  const query = useQuery({
    queryKey: journalKeys.entry(id ?? ''),
    queryFn: () => repository.findById(id!),
    enabled,
  });

  if (!enabled) {
    return {
      entry: null,
      status: JournalEntryDetailStatus.NotFound,
      reload: () => undefined,
    };
  }

  let status: JournalEntryDetailStatus;
  if (query.isPending) {
    status = JournalEntryDetailStatus.Loading;
  } else if (query.isError) {
    status = JournalEntryDetailStatus.Error;
  } else if (query.data == null) {
    status = JournalEntryDetailStatus.NotFound;
  } else {
    status = JournalEntryDetailStatus.Ready;
  }

  return {
    entry: query.data ?? null,
    status,
    reload: () => {
      void query.refetch();
    },
  };
}
