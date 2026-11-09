import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import { normalizeEntryId } from '@/hooks/normalize-entry-id';

export const DELETE_ENTRY_ERROR_MESSAGE = "Couldn't delete this entry. Please try again.";

export type UseJournalEntryDeleteResult = {
  deleteError: string | null;
  isDeleting: boolean;
  requestDelete: () => void;
};

function leaveDetailScreen() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function useJournalEntryDelete(
  rawId: string | string[] | undefined,
): UseJournalEntryDeleteResult {
  const repository = useReadyJournalRepository();
  const id = normalizeEntryId(rawId);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const operationIdRef = useRef(0);
  const isDeletingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const operationId = ++operationIdRef.current;

    return () => {
      mountedRef.current = false;
      if (operationIdRef.current === operationId) {
        operationIdRef.current += 1;
      }
    };
  }, [id]);

  const performDelete = useCallback(async () => {
    if (!id || isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;
    setIsDeleting(true);
    setDeleteError(null);

    const operationId = operationIdRef.current;
    const deletingId = id;

    try {
      await repository.delete(deletingId);
      if (!mountedRef.current || operationId !== operationIdRef.current) {
        return;
      }
      leaveDetailScreen();
    } catch {
      if (!mountedRef.current || operationId !== operationIdRef.current) {
        return;
      }
      setDeleteError(DELETE_ENTRY_ERROR_MESSAGE);
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }, [id, repository]);

  const requestDelete = useCallback(() => {
    if (!id || isDeletingRef.current) {
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
  }, [id, performDelete]);

  return {
    deleteError,
    isDeleting,
    requestDelete,
  };
}
