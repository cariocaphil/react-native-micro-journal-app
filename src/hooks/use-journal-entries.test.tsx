import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntriesStatus } from '@/hooks/journal-entries-status';
import {
  LOAD_ENTRIES_ERROR_MESSAGE,
  useJournalEntries,
} from '@/hooks/use-journal-entries';

type FocusEffectCallback = () => undefined | void | (() => void);

let mockLatestFocusCallback: FocusEffectCallback | null = null;
let mockLatestFocusCleanup: (() => void) | undefined;

function simulateBlur() {
  mockLatestFocusCleanup?.();
  mockLatestFocusCleanup = undefined;
}

function simulateFocus() {
  simulateBlur();
  if (!mockLatestFocusCallback) {
    throw new Error('No useFocusEffect callback registered');
  }
  const cleanup = mockLatestFocusCallback();
  mockLatestFocusCleanup = typeof cleanup === 'function' ? cleanup : undefined;
}

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');

  return {
    useFocusEffect: (callback: FocusEffectCallback) => {
      React.useEffect(() => {
        mockLatestFocusCallback = callback;
        const cleanup = callback();
        mockLatestFocusCleanup = typeof cleanup === 'function' ? cleanup : undefined;

        return () => {
          mockLatestFocusCleanup?.();
          mockLatestFocusCleanup = undefined;
          if (mockLatestFocusCallback === callback) {
            mockLatestFocusCallback = null;
          }
        };
      }, [callback]);
    },
  };
});

const entryOne: JournalEntry = {
  id: 'entry-1',
  content: 'First reflection.',
  mood: 'good',
  createdAt: '2024-06-15T12:00:00.000Z',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

const entryTwo: JournalEntry = {
  id: 'entry-2',
  content: 'Second reflection.',
  mood: 'okay',
  createdAt: '2024-06-15T13:00:00.000Z',
  updatedAt: '2024-06-15T13:00:00.000Z',
};

function createMockRepository(
  findAllImpl?: JournalRepository['findAll'],
): JournalRepository {
  return {
    create: jest.fn(async () => entryOne) as JournalRepository['create'],
    findById: jest.fn(async () => null) as JournalRepository['findById'],
    findAll: (findAllImpl ??
      jest.fn(async () => [])) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

function createWrapper(repository: JournalRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <JournalRepositoryProvider repository={repository}>{children}</JournalRepositoryProvider>
    );
  };
}

describe('useJournalEntries', () => {
  beforeEach(() => {
    mockLatestFocusCallback = null;
    mockLatestFocusCleanup = undefined;
  });

  it('starts loading and becomes ready with entries from findAll', async () => {
    let resolveFindAll: ((entries: JournalEntry[]) => void) | undefined;
    const findAll = jest.fn(
      () =>
        new Promise<JournalEntry[]>((resolve) => {
          resolveFindAll = resolve;
        }),
    ) as JournalRepository['findAll'];
    const repository = createMockRepository(findAll);

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    expect(result.current.status).toBe(JournalEntriesStatus.Loading);
    expect(result.current.entries).toEqual([]);
    expect(result.current.refreshError).toBeNull();

    await act(async () => {
      resolveFindAll?.([entryOne]);
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    });
    expect(result.current.entries).toEqual([entryOne]);
    expect(result.current.refreshError).toBeNull();
  });

  it('treats an empty findAll result as ready, not an error', async () => {
    const repository = createMockRepository(
      jest.fn(async () => []) as JournalRepository['findAll'],
    );

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    });
    expect(result.current.entries).toEqual([]);
    expect(result.current.refreshError).toBeNull();
  });

  it('sets a full-screen error on initial failure and recovers via reload', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([entryOne]);
    const repository = createMockRepository(findAll);

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Error);
    });
    expect(result.current.entries).toEqual([]);
    expect(result.current.refreshError).toBeNull();

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    });
    expect(result.current.entries).toEqual([entryOne]);
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('keeps entries and sets refreshError when a silent refresh fails', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockResolvedValueOnce([entryOne])
      .mockRejectedValueOnce(new Error('refresh failed'));
    const repository = createMockRepository(findAll);

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    });
    expect(result.current.entries).toEqual([entryOne]);

    await act(async () => {
      simulateFocus();
    });

    await waitFor(() => {
      expect(result.current.refreshError).toBe(LOAD_ENTRIES_ERROR_MESSAGE);
    });
    expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    expect(result.current.entries).toEqual([entryOne]);
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('reloads entries when the screen is focused again', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockResolvedValueOnce([entryOne])
      .mockResolvedValueOnce([entryTwo, entryOne]);
    const repository = createMockRepository(findAll);

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.entries).toEqual([entryOne]);
    });

    await act(async () => {
      simulateFocus();
    });

    await waitFor(() => {
      expect(result.current.entries).toEqual([entryTwo, entryOne]);
    });
    expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    expect(result.current.refreshError).toBeNull();
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('ignores stale findAll results after blur cancels the in-flight load', async () => {
    let resolveFirst: ((entries: JournalEntry[]) => void) | undefined;
    let resolveSecond: ((entries: JournalEntry[]) => void) | undefined;
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockImplementationOnce(
        () =>
          new Promise<JournalEntry[]>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<JournalEntry[]>((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const repository = createMockRepository(findAll);

    const { result } = await renderHook(() => useJournalEntries(), {
      wrapper: createWrapper(repository),
    });

    expect(result.current.status).toBe(JournalEntriesStatus.Loading);
    expect(findAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      simulateFocus();
    });
    expect(findAll).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirst?.([entryOne]);
    });

    // Stale first response must not win after blur cancelled it.
    expect(result.current.status).toBe(JournalEntriesStatus.Loading);
    expect(result.current.entries).toEqual([]);

    await act(async () => {
      resolveSecond?.([entryTwo]);
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntriesStatus.Ready);
    });
    expect(result.current.entries).toEqual([entryTwo]);
  });
});
