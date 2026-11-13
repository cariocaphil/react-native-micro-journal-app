import { useQuery } from '@tanstack/react-query';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntriesStatus } from '@/hooks/journal-entries-status';
import { journalKeys } from '@/journal/journal-query-keys';

export const LOAD_ENTRIES_ERROR_MESSAGE = "Couldn't load your entries. Please try again.";

export type UseJournalEntriesResult = {
  entries: JournalEntry[];
  status: JournalEntriesStatus;
  refreshError: string | null;
  reload: () => void;
};

export function useJournalEntries(): UseJournalEntriesResult {
  const repository = useReadyJournalRepository();

  const query = useQuery({
    queryKey: journalKeys.entries(),
    queryFn: () => repository.findAll(),
  });

  const hasData = query.data !== undefined;
  const refreshError =
    hasData && query.isError ? LOAD_ENTRIES_ERROR_MESSAGE : null;

  let status: JournalEntriesStatus;
  if (!hasData && query.isPending) {
    status = JournalEntriesStatus.Loading;
  } else if (!hasData && query.isError) {
    status = JournalEntriesStatus.Error;
  } else {
    status = JournalEntriesStatus.Ready;
  }

  return {
    entries: query.data ?? [],
    status,
    refreshError,
    reload: () => {
      void query.refetch();
    },
  };
}
