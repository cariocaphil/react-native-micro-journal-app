import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { JournalRepository } from '@/database/journal-repository';
import { createRepositoryQueryWrapper } from '@/database/test-query-provider';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import {
  ENTRY_GONE_MESSAGE,
  PERSISTENCE_ERROR_MESSAGE,
} from '@/journal/edit-entry-submit';
import { useEditJournalEntry } from '@/hooks/use-edit-journal-entry';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
}));

const updatedEntry: JournalEntry = {
  id: 'entry-1',
  content: 'Updated reflection',
  mood: 'great',
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

function createMockRepository(
  updateImpl?: JournalRepository['update'],
): JournalRepository {
  return {
    create: jest.fn(async () => updatedEntry) as JournalRepository['create'],
    findById: jest.fn(async () => updatedEntry) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: (updateImpl ??
      jest.fn(async () => updatedEntry)) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

function createWrapper(repository: JournalRepository) {
  return createRepositoryQueryWrapper(repository).Wrapper;
}

describe('useEditJournalEntry', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('initializes form state from the provided values', async () => {
    const repository = createMockRepository();
    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    expect(result.current.content).toBe('Original content');
    expect(result.current.mood).toBe('okay');
  });

  it('saves successfully and navigates back while mounted', async () => {
    const update = jest.fn(async () => updatedEntry) as JournalRepository['update'];
    const repository = createMockRepository(update);

    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      result.current.setContent('Updated reflection');
      result.current.setMood('great');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(update).toHaveBeenCalledWith('entry-1', {
      content: 'Updated reflection',
      mood: 'great',
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('does not navigate back when unmounted before save completes', async () => {
    let resolveUpdate: ((entry: JournalEntry) => void) | undefined;
    const update = jest.fn(
      () =>
        new Promise<JournalEntry>((resolve) => {
          resolveUpdate = resolve;
        }),
    ) as JournalRepository['update'];
    const repository = createMockRepository(update);

    const { result, unmount } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      void result.current.save();
    });
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => {
      unmount();
    });

    await act(async () => {
      resolveUpdate?.(updatedEntry);
    });

    expect(mockBack).not.toHaveBeenCalled();
  });

  it('prevents duplicate saves while a save is in flight', async () => {
    let resolveUpdate: ((entry: JournalEntry) => void) | undefined;
    const update = jest.fn(
      () =>
        new Promise<JournalEntry>((resolve) => {
          resolveUpdate = resolve;
        }),
    ) as JournalRepository['update'];
    const repository = createMockRepository(update);

    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      void result.current.save();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });

    await act(async () => {
      void result.current.save();
    });
    expect(update).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate?.(updatedEntry);
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps edited values and shows a persistence error on failure', async () => {
    const repository = createMockRepository(
      jest.fn(async () => {
        throw new Error('write failed');
      }) as JournalRepository['update'],
    );

    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      result.current.setContent('Attempted edit');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.content).toBe('Attempted edit');
    expect(result.current.persistenceError).toBe(PERSISTENCE_ERROR_MESSAGE);
    expect(result.current.notFoundError).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows a distinct not-found message when the entry is gone', async () => {
    const repository = createMockRepository(
      jest.fn(async () => null) as JournalRepository['update'],
    );

    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.notFoundError).toBe(ENTRY_GONE_MESSAGE);
    expect(result.current.persistenceError).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('cancels without saving when not mid-save', async () => {
    const repository = createMockRepository();
    const { result } = await renderHook(
      () =>
        useEditJournalEntry({
          id: 'entry-1',
          initialContent: 'Original content',
          initialMood: 'okay',
        }),
      { wrapper: createWrapper(repository) },
    );

    await act(async () => {
      result.current.cancel();
    });

    expect(repository.update).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
