import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import EditEntryScreen from '@/app/entry/[id]/edit';
import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import {
  ENTRY_GONE_MESSAGE,
  PERSISTENCE_ERROR_MESSAGE,
} from '@/journal/edit-entry-submit';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';

const mockBack = jest.fn();
let mockRouteId: string | string[] | undefined = 'entry-1';

type FocusEffectCallback = () => undefined | void | (() => void);

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');

  return {
    router: {
      back: (...args: unknown[]) => mockBack(...args),
    },
    useLocalSearchParams: () => ({ id: mockRouteId }),
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

const existingEntry: JournalEntry = {
  id: 'entry-1',
  content: 'Original reflection.',
  mood: 'okay',
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-15T10:00:00.000Z',
};

const updatedEntry: JournalEntry = {
  ...existingEntry,
  content: 'Updated reflection.',
  mood: 'great',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

function createMockRepository(options?: {
  findById?: JournalRepository['findById'];
  update?: JournalRepository['update'];
}): JournalRepository {
  return {
    create: jest.fn(async () => existingEntry) as JournalRepository['create'],
    findById: (options?.findById ??
      jest.fn(async () => existingEntry)) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: (options?.update ??
      jest.fn(async () => updatedEntry)) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

async function renderEdit(repository: JournalRepository) {
  return render(
    <JournalRepositoryProvider repository={repository}>
      <EditEntryScreen />
    </JournalRepositoryProvider>,
  );
}

describe('EditEntryScreen', () => {
  beforeEach(() => {
    mockRouteId = 'entry-1';
    mockBack.mockClear();
  });

  it('prepopulates content and mood from the loaded entry', async () => {
    await renderEdit(createMockRepository());

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    expect(screen.getByLabelText('Mood okay')).toBeSelected();
  });

  it('allows content and mood to be modified and saved', async () => {
    const update = jest.fn(async () => updatedEntry) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Journal entry'),
      'Updated reflection.',
    );
    await fireEvent.press(screen.getByLabelText('Mood great'));
    await fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => {
      expect(update).toHaveBeenCalledTimes(1);
    });
    expect(update).toHaveBeenCalledWith('entry-1', {
      content: 'Updated reflection.',
      mood: 'great',
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows a validation error for invalid content', async () => {
    const update = jest.fn(async () => updatedEntry) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Journal entry'), '   ');
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(await screen.findByText('Enter a journal entry.')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('cancels without persisting changes', async () => {
    const update = jest.fn(async () => updatedEntry) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'Changed locally');
    await fireEvent.press(screen.getByLabelText('Cancel'));

    expect(update).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows a persistence error and preserves input on save failure', async () => {
    const update = jest.fn(async () => {
      throw new Error('write failed');
    }) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'Attempted edit');
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(await screen.findByText(PERSISTENCE_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByDisplayValue('Attempted edit')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows a missing-entry message when update returns null', async () => {
    const update = jest.fn(async () => null) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(await screen.findByText(ENTRY_GONE_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(PERSISTENCE_ERROR_MESSAGE)).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows not found when the entry cannot be loaded', async () => {
    const findById = jest.fn(async () => null) as JournalRepository['findById'];
    await renderEdit(createMockRepository({ findById }));

    expect(await screen.findByText('This entry could not be found.')).toBeTruthy();
    expect(screen.queryByLabelText('Journal entry')).toBeNull();
  });

  it('shows a load error and retries successfully', async () => {
    const findById = jest
      .fn<JournalRepository['findById']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(existingEntry);

    await renderEdit(createMockRepository({ findById }));

    expect(await screen.findByText(LOAD_ENTRY_ERROR_MESSAGE)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry'));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it('prevents rapid double submissions from calling update twice', async () => {
    let resolveUpdate: ((entry: JournalEntry) => void) | undefined;
    const update = jest.fn(
      () =>
        new Promise<JournalEntry>((resolve) => {
          resolveUpdate = resolve;
        }),
    ) as JournalRepository['update'];
    await renderEdit(createMockRepository({ update }));

    expect(await screen.findByDisplayValue('Original reflection.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(update).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Saving')).toBeDisabled();

    await fireEvent.press(screen.getByLabelText('Saving'));
    expect(update).toHaveBeenCalledTimes(1);

    resolveUpdate?.(updatedEntry);

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
