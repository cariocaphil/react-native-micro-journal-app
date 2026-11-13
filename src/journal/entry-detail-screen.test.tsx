import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import EntryDetailScreen from '@/app/entry/[id]/index';
import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { DELETE_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-delete';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';
import { formatEntryDate } from '@/journal/format-entry-date';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn(() => true);
let mockRouteId: string | string[] | undefined = 'entry-1';

type FocusEffectCallback = () => undefined | void | (() => void);

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');

  return {
    router: {
      back: (...args: unknown[]) => mockBack(...args),
      replace: (...args: unknown[]) => mockReplace(...args),
      push: (...args: unknown[]) => mockPush(...args),
      canGoBack: () => mockCanGoBack(),
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

const entryOne: JournalEntry = {
  id: 'entry-1',
  content: 'A full journal reflection.',
  mood: 'good',
  createdAt: '2024-06-15T12:00:00.000Z',
  updatedAt: '2024-06-15T13:00:00.000Z',
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

async function renderDetail(repository: JournalRepository) {
  return render(
    <JournalRepositoryProvider repository={repository}>
      <EntryDetailScreen />
    </JournalRepositoryProvider>,
  );
}

type AlertButton = { text?: string; onPress?: () => void };

function pressAlertButton(label: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  buttons?.find((item) => item.text === label)?.onPress?.();
}

describe('EntryDetailScreen', () => {
  beforeEach(() => {
    mockRouteId = 'entry-1';
    mockBack.mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
    mockCanGoBack.mockReturnValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('renders mood, dates, and full content for an existing entry', async () => {
    await renderDetail(createMockRepository());

    expect(await screen.findByText('good')).toBeTruthy();
    expect(screen.getByText(`Created ${formatEntryDate(entryOne.createdAt)}`)).toBeTruthy();
    expect(screen.getByText(`Updated ${formatEntryDate(entryOne.updatedAt)}`)).toBeTruthy();
    expect(screen.getByText('A full journal reflection.')).toBeTruthy();
  });

  it('shows not found for an unknown entry id', async () => {
    const findById = jest.fn(async () => null) as JournalRepository['findById'];
    await renderDetail(createMockRepository({ findById }));

    expect(await screen.findByText('This entry could not be found.')).toBeTruthy();
  });

  it('shows a load error and retries successfully', async () => {
    const findById = jest
      .fn<JournalRepository['findById']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(entryOne);

    await renderDetail(createMockRepository({ findById }));

    expect(await screen.findByText(LOAD_ENTRY_ERROR_MESSAGE)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry'));

    expect(await screen.findByText('A full journal reflection.')).toBeTruthy();
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it('opens the edit screen for the current entry', async () => {
    await renderDetail(createMockRepository());

    expect(await screen.findByText('A full journal reflection.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Edit entry'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/entry/[id]/edit',
      params: { id: 'entry-1' },
    });
  });

  it('deletes after confirmation and navigates home', async () => {
    const deleteFn = jest.fn(async () => true) as JournalRepository['delete'];
    await renderDetail(createMockRepository({ delete: deleteFn }));

    expect(await screen.findByText('A full journal reflection.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Delete entry'));
    pressAlertButton('Delete');

    await waitFor(() => {
      expect(deleteFn).toHaveBeenCalledWith('entry-1');
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('keeps the screen and shows an error when deletion fails', async () => {
    const deleteFn = jest.fn(async () => {
      throw new Error('delete failed');
    }) as JournalRepository['delete'];
    await renderDetail(createMockRepository({ delete: deleteFn }));

    expect(await screen.findByText('A full journal reflection.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Delete entry'));
    pressAlertButton('Delete');

    expect(await screen.findByText(DELETE_ENTRY_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByText('A full journal reflection.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
