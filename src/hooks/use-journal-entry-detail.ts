import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { normalizeEntryId } from '@/hooks/normalize-entry-id';

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

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [status, setStatus] = useState<JournalEntryDetailStatus>(
    id ? JournalEntryDetailStatus.Loading : JournalEntryDetailStatus.NotFound,
  );

  const generationRef = useRef(0);

  const load = useCallback(async () => {
    const currentId = id;
    const generation = ++generationRef.current;

    if (!currentId) {
      setEntry(null);
      setStatus(JournalEntryDetailStatus.NotFound);
      return;
    }

    setStatus(JournalEntryDetailStatus.Loading);

    try {
      const found = await repository.findById(currentId);
      if (generation !== generationRef.current) {
        return;
      }
      if (!found) {
        setEntry(null);
        setStatus(JournalEntryDetailStatus.NotFound);
        return;
      }
      setEntry(found);
      setStatus(JournalEntryDetailStatus.Ready);
    } catch {
      if (generation !== generationRef.current) {
        return;
      }
      setEntry(null);
      setStatus(JournalEntryDetailStatus.Error);
    }
  }, [id, repository]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();

      return () => {
        generationRef.current += 1;
      };
    }, [load]),
  );

  return {
    entry,
    status,
    reload,
  };
}
