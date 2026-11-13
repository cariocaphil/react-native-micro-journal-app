import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import { CreateJournalEntrySchema, type Mood } from '@/domain/journal/journal-entry';
import { journalKeys } from '@/journal/journal-query-keys';
import {
  mapCreateEntryFieldErrors,
  PERSISTENCE_ERROR_MESSAGE,
  type NewEntryFieldErrors,
} from '@/journal/new-entry-submit';

export function useNewEntryForm() {
  const repository = useReadyJournalRepository();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('okay');
  const [fieldErrors, setFieldErrors] = useState<NewEntryFieldErrors>({});
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const createMutation = useMutation({
    mutationFn: (input: { content: string; mood: Mood }) => repository.create(input),
  });

  async function save() {
    if (isSavingRef.current || createMutation.isPending) {
      return;
    }

    isSavingRef.current = true;
    setFieldErrors({});
    setPersistenceError(null);

    const parsed = CreateJournalEntrySchema.safeParse({ content, mood });
    if (!parsed.success) {
      setFieldErrors(mapCreateEntryFieldErrors(parsed.error));
      isSavingRef.current = false;
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      void queryClient.invalidateQueries({ queryKey: journalKeys.entries() });
      isSavingRef.current = false;
      router.back();
    } catch {
      setPersistenceError(PERSISTENCE_ERROR_MESSAGE);
      isSavingRef.current = false;
    }
  }

  function cancel() {
    if (isSavingRef.current || createMutation.isPending) {
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
    isSaving: createMutation.isPending,
    save,
    cancel,
  };
}
