import { router } from 'expo-router';
import { useRef, useState } from 'react';

import {
  submitNewJournalEntry,
  type NewEntryFieldErrors,
} from '@/journal/new-entry-submit';
import { useReadyJournalRepository } from '@/database/journal-repository-context';
import type { Mood } from '@/domain/journal/journal-entry';

export function useNewEntryForm() {
  const repository = useReadyJournalRepository();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('okay');
  const [fieldErrors, setFieldErrors] = useState<NewEntryFieldErrors>({});
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  async function save() {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setFieldErrors({});
    setPersistenceError(null);

    const result = await submitNewJournalEntry(repository, { content, mood });

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
    isSaving,
    save,
    cancel,
  };
}
