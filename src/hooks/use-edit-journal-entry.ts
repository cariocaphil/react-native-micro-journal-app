import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { Mood } from '@/domain/journal/journal-entry';
import {
  ENTRY_GONE_MESSAGE,
  submitUpdateJournalEntry,
  type EditEntryFieldErrors,
} from '@/journal/edit-entry-submit';

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

  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<Mood>(initialMood);
  const [fieldErrors, setFieldErrors] = useState<EditEntryFieldErrors>({});
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isSavingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function save() {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setFieldErrors({});
    setPersistenceError(null);
    setNotFoundError(null);

    const result = await submitUpdateJournalEntry(repository, id, { content, mood });

    if (!mountedRef.current) {
      return;
    }

    if (result.status === 'validation') {
      setFieldErrors(result.fieldErrors);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    if (result.status === 'persistence') {
      setPersistenceError(result.message);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    if (result.status === 'notFound') {
      setNotFoundError(ENTRY_GONE_MESSAGE);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    isSavingRef.current = false;
    setIsSaving(false);
    router.back();
  }

  function cancel() {
    if (isSavingRef.current) {
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
    isSaving,
    save,
    cancel,
  };
}
