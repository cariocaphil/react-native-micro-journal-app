import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import {
  DELETE_ENTRY_ERROR_MESSAGE,
  useJournalEntryDetail,
} from '@/hooks/use-journal-entry-detail';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);

type FocusEffectCallback = () => undefined | void | (() => void);

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');

  return {
    router: {
      back: (...args: unknown[]) => mockBack(...args),
      replace: (...args: unknown[]) => mockReplace(...args),
      canGoBack: () => mockCanGoBack(),
    },
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

function createMockRepository(options?: {
  findById?: JournalRepository['findById'];
  delete?: JournalRepository['delete'];
}): JournalRepository {
  return {
    create: jest.fn(async () => entryOne) as JournalRepository['create'],
    findById: (options?.findById ??
      jest.fn(async () => entryOne)) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: (options?.delete ??
      jest.fn(async () => true)) as JournalRepository['delete'],
  };
}

function createWrapper(repository: JournalRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <JournalRepositoryProvider repository={repository}>{children}</JournalRepositoryProvider>
    );
  };
}

type AlertButton = { text?: string; onPress?: () => void };

function pressAlertButton(label: string) {
  const alertMock = jest.mocked(Alert.alert);
  const buttons = alertMock.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((item) => item.text === label);
  button?.onPress?.();
}

describe('useJournalEntryDetail', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('loads an existing entry', async () => {
    const findById = jest.fn(async () => entryOne) as JournalRepository['findById'];
    const repository = createMockRepository({ findById });

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
    const repository = createMockRepository({ findById });

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
    const repository = createMockRepository({ findById });

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
    const repository = createMockRepository({ findById });

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
    const repository = createMockRepository({ findById });

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

  it('does not delete when the alert is cancelled', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    const repository = createMockRepository({ delete: deleteFn });

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
    });
    await act(async () => {
      pressAlertButton('Cancel');
    });

    expect(deleteFn).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('deletes on confirm and navigates back when possible', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    const repository = createMockRepository({ delete: deleteFn });

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
    });
    await act(async () => {
      pressAlertButton('Delete');
    });

    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledWith('entry-1');
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('treats an already-deleted entry as success and navigates home', async () => {
    const deleteFn = jest.fn(async () => false) as JournalRepository['delete'];
    const repository = createMockRepository({ delete: deleteFn });

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
    });

    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledTimes(1);
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('replaces home when there is no back stack', async () => {
    mockCanGoBack.mockReturnValue(false);
    const repository = createMockRepository();

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('keeps the detail screen and shows an error when delete fails', async () => {
    const deleteFn = jest.fn(async () => {
      throw new Error('delete failed');
    }) as JournalRepository['delete'];
    const repository = createMockRepository({ delete: deleteFn });

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
    });

    await waitFor(() => {
      expect(result.current.deleteError).toBe(DELETE_ENTRY_ERROR_MESSAGE);
    });
    expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    expect(result.current.isDeleting).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('prevents duplicate delete requests with a synchronous guard', async () => {
    let resolveDelete: ((value: boolean) => void) | undefined;
    const deleteFn = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDelete = resolve;
        }),
    ) as JournalRepository['delete'];
    const repository = createMockRepository({ delete: deleteFn });

    const { result } = await renderHook(() => useJournalEntryDetail('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
      pressAlertButton('Delete');
    });

    expect(deleteFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveDelete?.(true);
    });
  });

  it('ignores stale delete completion after the id changes', async () => {
    let resolveDelete: ((value: boolean) => void) | undefined;
    const deleteFn = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDelete = resolve;
        }),
    ) as JournalRepository['delete'];
    const findById = jest
      .fn<JournalRepository['findById']>()
      .mockResolvedValueOnce(entryOne)
      .mockResolvedValueOnce({
        ...entryOne,
        id: 'entry-2',
        content: 'Second reflection.',
      });
    const repository = createMockRepository({ findById, delete: deleteFn });

    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useJournalEntryDetail(id),
      {
        initialProps: { id: 'entry-1' },
        wrapper: createWrapper(repository),
      },
    );

    await waitFor(() => {
      expect(result.current.status).toBe(JournalEntryDetailStatus.Ready);
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
    });
    expect(deleteFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ id: 'entry-2' });
    });

    await waitFor(() => {
      expect(result.current.entry?.id).toBe('entry-2');
    });

    await act(async () => {
      resolveDelete?.(true);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.deleteError).toBeNull();
  });
});
