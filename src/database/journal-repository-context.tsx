import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { openJournalDatabase } from '@/database/database';
import {
  createJournalRepository,
  type JournalRepository,
} from '@/database/journal-repository';

type JournalRepositoryStatus = 'loading' | 'ready' | 'error';

type JournalRepositoryContextValue = {
  status: JournalRepositoryStatus;
  repository: JournalRepository | null;
  error: Error | null;
};

const JournalRepositoryContext = createContext<JournalRepositoryContextValue | null>(null);

type JournalRepositoryProviderProps = {
  children: ReactNode;
  /** Inject a repository for tests; skips opening SQLite and starts as ready. */
  repository?: JournalRepository;
};

type AsyncRepositoryState = {
  status: JournalRepositoryStatus;
  repository: JournalRepository | null;
  error: Error | null;
};

const loadingState: AsyncRepositoryState = {
  status: 'loading',
  repository: null,
  error: null,
};

export function JournalRepositoryProvider({
  children,
  repository: injectedRepository,
}: JournalRepositoryProviderProps) {
  const [asyncState, setAsyncState] = useState<AsyncRepositoryState>(loadingState);

  useEffect(() => {
    if (injectedRepository) {
      return;
    }

    let cancelled = false;

    async function initialize() {
      try {
        const db = await openJournalDatabase();
        if (cancelled) {
          return;
        }
        setAsyncState({
          status: 'ready',
          repository: createJournalRepository(db),
          error: null,
        });
      } catch (cause) {
        if (cancelled) {
          return;
        }
        const nextError =
          cause instanceof Error ? cause : new Error('Failed to open journal database');
        setAsyncState({
          status: 'error',
          repository: null,
          error: nextError,
        });
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [injectedRepository]);

  const value: JournalRepositoryContextValue = injectedRepository
    ? { status: 'ready', repository: injectedRepository, error: null }
    : asyncState;

  return (
    <JournalRepositoryContext.Provider value={value}>{children}</JournalRepositoryContext.Provider>
  );
}

export function useJournalRepositoryStatus(): JournalRepositoryContextValue {
  const context = useContext(JournalRepositoryContext);
  if (!context) {
    throw new Error('useJournalRepositoryStatus must be used within a JournalRepositoryProvider');
  }
  return context;
}

/**
 * Returns the journal repository when ready, or null while loading/error.
 * Throws only when used outside JournalRepositoryProvider.
 */
export function useJournalRepository(): JournalRepository | null {
  const context = useContext(JournalRepositoryContext);
  if (!context) {
    throw new Error('useJournalRepository must be used within a JournalRepositoryProvider');
  }
  return context.repository;
}

/**
 * Returns a non-null journal repository for screens mounted after initialization.
 * Throws when used outside JournalRepositoryProvider, or if the repository is not ready
 * (which should not happen when the root layout gates on status === 'ready').
 */
export function useReadyJournalRepository(): JournalRepository {
  const context = useContext(JournalRepositoryContext);
  if (!context) {
    throw new Error('useReadyJournalRepository must be used within a JournalRepositoryProvider');
  }
  if (!context.repository) {
    throw new Error(
      'Journal repository is not ready. Mount screens only after JournalRepositoryProvider reports ready.',
    );
  }
  return context.repository;
}
