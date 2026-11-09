import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { normalizeEntryId } from '@/hooks/normalize-entry-id';

export const LOAD_ENTRY_ERROR_MESSAGE = "Couldn't load this entry. Please try again.";
export const DELETE_ENTRY_ERROR_MESSAGE = "Couldn't delete this entry. Please try again.";

export type UseJournalEntryDetailResult = {
  entry: JournalEntry | null;
  status: JournalEntryDetailStatus;
  deleteError: string | null;
  isDeleting: boolean;
  reload: () => void;
  requestDelete: () => void;
};

function leaveDetailScreen() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function useJournalEntryDetail(
  rawId: string | string[] | undefined,
): UseJournalEntryDetailResult {
  const repository = useReadyJournalRepository();
  const id = normalizeEntryId(rawId);

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [status, setStatus] = useState<JournalEntryDetailStatus>(
    id ? JournalEntryDetailStatus.Loading : JournalEntryDetailStatus.NotFound,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const generationRef = useRef(0);
  const isDeletingRef = useRef(false);
  const idRef = useRef(id);

  const load = useCallback(async () => {
    const currentId = id;
    idRef.current = currentId;
    const generation = ++generationRef.current;

    isDeletingRef.current = false;
    setIsDeleting(false);
    setDeleteError(null);

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

  const performDelete = useCallback(async () => {
    const currentId = idRef.current;
    if (!currentId || isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);

    const generation = generationRef.current;
    const deletingId = currentId;

    try {
      await repository.delete(deletingId);
      if (generation !== generationRef.current || idRef.current !== deletingId) {
        return;
      }
      leaveDetailScreen();
    } catch {
      if (generation !== generationRef.current || idRef.current !== deletingId) {
        return;
      }
      setDeleteError(DELETE_ENTRY_ERROR_MESSAGE);
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }, [repository]);

  const requestDelete = useCallback(() => {
    if (!idRef.current || isDeletingRef.current) {
      return;
    }

    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void performDelete();
        },
      },
    ]);
  }, [performDelete]);

  return {
    entry,
    status,
    deleteError,
    isDeleting,
    reload,
    requestDelete,
  };
}
