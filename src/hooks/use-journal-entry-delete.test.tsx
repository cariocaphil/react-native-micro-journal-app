import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import {
  DELETE_ENTRY_ERROR_MESSAGE,
  useJournalEntryDelete,
} from '@/hooks/use-journal-entry-delete';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => mockCanGoBack(),
  },
}));

const entryOne: JournalEntry = {
  id: 'entry-1',
  content: 'First reflection.',
  mood: 'good',
  createdAt: '2024-06-15T12:00:00.000Z',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

function createMockRepository(deleteImpl?: JournalRepository['delete']): JournalRepository {
  return {
    create: jest.fn(async () => entryOne) as JournalRepository['create'],
    findById: jest.fn(async () => entryOne) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: (deleteImpl ?? jest.fn(async () => true)) as JournalRepository['delete'],
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

describe('useJournalEntryDelete', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.mocked(Alert.alert).mockClear();
  });

  it('does not delete when the alert is cancelled', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
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

  it('does not call delete for an empty id', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('   '), {
      wrapper: createWrapper(repository),
    });

    await act(async () => {
      result.current.requestDelete();
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('deletes on confirm and navigates back when possible', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
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
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
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

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
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

  it('keeps the screen and shows an error when delete fails', async () => {
    const deleteFn = jest.fn(async () => {
      throw new Error('delete failed');
    }) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
    });

    await act(async () => {
      result.current.requestDelete();
      pressAlertButton('Delete');
    });

    await waitFor(() => {
      expect(result.current.deleteError).toBe(DELETE_ENTRY_ERROR_MESSAGE);
    });
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
    const repository = createMockRepository(deleteFn);

    const { result } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
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

  it('ignores stale delete completion after unmount', async () => {
    let resolveDelete: ((value: boolean) => void) | undefined;
    const deleteFn = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDelete = resolve;
        }),
    ) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result, unmount } = await renderHook(() => useJournalEntryDelete('entry-1'), {
      wrapper: createWrapper(repository),
    });

    result.current.requestDelete();
    pressAlertButton('Delete');
    expect(deleteFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolveDelete?.(true);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('ignores stale delete completion after the id changes', async () => {
    let resolveDelete: ((value: boolean) => void) | undefined;
    const deleteFn = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDelete = resolve;
        }),
    ) as JournalRepository['delete'];
    const repository = createMockRepository(deleteFn);

    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useJournalEntryDelete(id),
      {
        initialProps: { id: 'entry-1' },
        wrapper: createWrapper(repository),
      },
    );

    expect(result.current).not.toBeNull();
    result.current.requestDelete();
    pressAlertButton('Delete');
    expect(deleteFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ id: 'entry-2' });
    });

    await act(async () => {
      resolveDelete?.(true);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.deleteError).toBeNull();
  });
});
