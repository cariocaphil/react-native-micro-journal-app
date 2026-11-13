import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import { CreateJournalEntrySchema, type Mood } from '@/domain/journal/journal-entry';
import {
  ENTRY_GONE_MESSAGE,
  PERSISTENCE_ERROR_MESSAGE,
  type EditEntryFieldErrors,
} from '@/journal/edit-entry-submit';
import { journalKeys } from '@/journal/journal-query-keys';
import { mapCreateEntryFieldErrors } from '@/journal/new-entry-submit';

export type UseEditJournalEntryParams = {
  id: string;
  initialContent: string;
  initialMood: Mood;
};

export function useEditJournalEntry({
  id,
  initialContent,
  initialMood,
}: UseEditJournalEntryParams) {
  const repository = useReadyJournalRepository();
  const queryClient = useQueryClient();

  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<Mood>(initialMood);
  const [fieldErrors, setFieldErrors] = useState<EditEntryFieldErrors>({});
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const isSavingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: (input: { content: string; mood: Mood }) => repository.update(id, input),
  });

  async function save() {
    if (isSavingRef.current || updateMutation.isPending) {
      return;
    }

    isSavingRef.current = true;
    setFieldErrors({});
    setPersistenceError(null);
    setNotFoundError(null);

    const parsed = CreateJournalEntrySchema.safeParse({ content, mood });
    if (!parsed.success) {
      setFieldErrors(mapCreateEntryFieldErrors(parsed.error));
      isSavingRef.current = false;
      return;
    }

    try {
      const entry = await updateMutation.mutateAsync(parsed.data);
      if (!mountedRef.current) {
        return;
      }

      if (!entry) {
        setNotFoundError(ENTRY_GONE_MESSAGE);
        isSavingRef.current = false;
        return;
      }

      void queryClient.invalidateQueries({ queryKey: journalKeys.entries() });
      void queryClient.invalidateQueries({ queryKey: journalKeys.entry(id) });
      isSavingRef.current = false;
      router.back();
    } catch {
      if (!mountedRef.current) {
        return;
      }
      setPersistenceError(PERSISTENCE_ERROR_MESSAGE);
      isSavingRef.current = false;
    }
  }

  function cancel() {
    if (isSavingRef.current || updateMutation.isPending) {
      return;
    }
    router.back();
  }

  return {
    content,
    setContent,
    mood,
    setMood,
    fieldErrors,
    persistenceError,
    notFoundError,
    isSaving: updateMutation.isPending,
    save,
    cancel,
  };
}
