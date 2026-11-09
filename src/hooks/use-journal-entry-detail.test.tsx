import { describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { useJournalEntryDetail } from '@/hooks/use-journal-entry-detail';

type FocusEffectCallback = () => undefined | void | (() => void);

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');

  return {
    useFocusEffect: (callback: FocusEffectCallback) => {
      React.useEffect(() => {
        const cleanup = callback();
        return () => {
          if (typeof cleanup === 'function') {
            cleanup();
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

function createMockRepository(
  findById?: JournalRepository['findById'],
): JournalRepository {
  return {
    create: jest.fn(async () => entryOne) as JournalRepository['create'],
    findById: (findById ??
      jest.fn(async () => entryOne)) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: jest.fn(async () => true) as JournalRepository['delete'],
  };
}

function createWrapper(repository: JournalRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <JournalRepositoryProvider repository={repository}>{children}</JournalRepositoryProvider>
    );
  };
}

describe('useJournalEntryDetail', () => {
  it('loads an existing entry', async () => {
    const findById = jest.fn(async () => entryOne) as JournalRepository['findById'];
    const repository = createMockRepository(findById);

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });
    expect(result.current.entry).toEqual(entryOne);
    expect(findById).toHaveBeenCalledWith('entry-1');
  });

  it('treats a missing repository entry as not found', async () => {
    const findById = jest.fn(async () => null) as JournalRepository['findById'];
    const repository = createMockRepository(findById);

    const { result } = await renderHook(() => useJournalEntryDetail('missing'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.NotFound);
    });
    expect(result.current.entry).toBeNull();
  });

  it('does not call findById for an empty id', async () => {
    const findById = jest.fn(async () => entryOne) as JournalRepository['findById'];
    const repository = createMockRepository(findById);

    const { result } = await renderHook(() => useJournalEntryDetail('   '), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.NotFound);
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('sets an error on load failure and recovers via reload', async () => {
    const findById = jest
      .fn<JournalRepository['findById']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(entryOne);
    const repository = createMockRepository(findById);

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Error);
    });

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });
    expect(result.current.entry).toEqual(entryOne);
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it('ignores stale load results after the id changes', async () => {
    let resolveFirst: ((entry: JournalEntry | null) => void) | undefined;
    const findById = jest
      .fn<JournalRepository['findById']>()
      .mockImplementationOnce(
        () =>
          new Promise<JournalEntry | null>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        ...entryOne,
        id: 'entry-2',
        content: 'Second reflection.',
      });
    const repository = createMockRepository(findById);

    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useJournalEntryDetail(id),
      {
        initialProps: { id: 'entry-1' },
        wrapper: createWrapper(repository),
      },
    );

    expect(findById).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ id: 'entry-2' });
    });

    await waitFor(() => {
      expect(findById).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      resolveFirst?.(entryOne);
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });
    expect(result.current.entry?.id).toBe('entry-2');
  });
});
