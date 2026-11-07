import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';

export const LOAD_ENTRIES_ERROR_MESSAGE = "Couldn't load your entries. Please try again.";

export type JournalEntriesStatus = 'loading' | 'ready' | 'error';

export type UseJournalEntriesResult = {
  entries: JournalEntry[];
  status: JournalEntriesStatus;
  refreshError: string | null;
  reload: () => void;
};

export function useJournalEntries(): UseJournalEntriesResult {
  const repository = useReadyJournalRepository();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<JournalEntriesStatus>('loading');
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const hasLoadedSuccessfullyRef = useRef(false);
  const loadGenerationRef = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    const wasReady = hasLoadedSuccessfullyRef.current;

    if (!wasReady) {
      setStatus('loading');
    }
    setRefreshError(null);

    try {
      const next = await repository.findAll();
      if (generation !== loadGenerationRef.current) {
        return;
      }
      hasLoadedSuccessfullyRef.current = true;
      setEntries(next);
      setStatus('ready');
      setRefreshError(null);
    } catch {
      if (generation !== loadGenerationRef.current) {
        return;
      }
      if (wasReady) {
        setRefreshError(LOAD_ENTRIES_ERROR_MESSAGE);
      } else {
        setStatus('error');
      }
    }
  }, [repository]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();

      return () => {
        loadGenerationRef.current += 1;
      };
    }, [load]),
  );

  return {
    entries,
    status,
    refreshError,
    reload,
  };
}
