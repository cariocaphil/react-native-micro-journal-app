import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import type { JournalRepository } from '@/database/journal-repository';
import { createRepositoryQueryWrapper } from '@/database/test-query-provider';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { LOAD_ENTRIES_ERROR_MESSAGE } from '@/hooks/use-journal-entries';
import { formatEntryDate } from '@/journal/format-entry-date';
import { journalKeys } from '@/journal/journal-query-keys';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

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

async function renderHome(repository: JournalRepository) {
  const { Wrapper } = createRepositoryQueryWrapper(repository);
  return render(
    <Wrapper>
      <HomeScreen />
    </Wrapper>,
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows a loading state while entries are retrieved', async () => {
    let resolveFindAll: ((entries: JournalEntry[]) => void) | undefined;
    const findAll = jest.fn(
      () =>
        new Promise<JournalEntry[]>((resolve) => {
          resolveFindAll = resolve;
        }),
    ) as JournalRepository['findAll'];
    const repository = createMockRepository(findAll);

    await renderHome(repository);

    expect(await screen.findByLabelText('Loading entries')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();

    resolveFindAll?.([]);

    expect(await screen.findByText('No entries yet. Create your first reflection.')).toBeTruthy();
  });

  it('shows an empty state when there are no entries', async () => {
    const repository = createMockRepository(jest.fn(async () => []) as JournalRepository['findAll']);
    await renderHome(repository);

    expect(await screen.findByText('No entries yet. Create your first reflection.')).toBeTruthy();
    expect(screen.getByLabelText('New Entry')).toBeTruthy();
  });

  it('renders persisted entries with mood, date, and content', async () => {
    const repository = createMockRepository(
      jest.fn(async () => [entryTwo, entryOne]) as JournalRepository['findAll'],
    );
    await renderHome(repository);

    expect(await screen.findByText('Second reflection.')).toBeTruthy();
    expect(screen.getByText('First reflection.')).toBeTruthy();
    expect(screen.getByText('okay')).toBeTruthy();
    expect(screen.getByText('good')).toBeTruthy();
    expect(screen.getByText(formatEntryDate(entryTwo.createdAt))).toBeTruthy();
    expect(screen.getByText(formatEntryDate(entryOne.createdAt))).toBeTruthy();
  });

  it('shows an initial error with retry that reloads entries', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([entryOne]);
    const repository = createMockRepository(findAll);

    await renderHome(repository);

    expect(await screen.findByText(LOAD_ENTRIES_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('First reflection.')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Retry'));

    expect(await screen.findByText('First reflection.')).toBeTruthy();
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('keeps visible entries and shows an inline error when refresh fails', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockResolvedValueOnce([entryOne])
      .mockRejectedValueOnce(new Error('refresh failed'));
    const repository = createMockRepository(findAll);
    const { Wrapper, queryClient } = createRepositoryQueryWrapper(repository);

    await render(
      <Wrapper>
        <HomeScreen />
      </Wrapper>,
    );

    expect(await screen.findByText('First reflection.')).toBeTruthy();
    expect(findAll).toHaveBeenCalledTimes(1);

    await queryClient.invalidateQueries({ queryKey: journalKeys.entries() });

    await waitFor(() => {
      expect(findAll).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText(LOAD_ENTRIES_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByText('First reflection.')).toBeTruthy();
    expect(screen.getByLabelText('New Entry')).toBeTruthy();
  });

  it('reloads entries when the entries query is invalidated', async () => {
    const findAll = jest
      .fn<JournalRepository['findAll']>()
      .mockResolvedValueOnce([entryOne])
      .mockResolvedValueOnce([entryTwo, entryOne]);
    const repository = createMockRepository(findAll);
    const { Wrapper, queryClient } = createRepositoryQueryWrapper(repository);

    await render(
      <Wrapper>
        <HomeScreen />
      </Wrapper>,
    );

    expect(await screen.findByText('First reflection.')).toBeTruthy();
    expect(screen.queryByText('Second reflection.')).toBeNull();
    expect(findAll).toHaveBeenCalledTimes(1);

    await queryClient.invalidateQueries({ queryKey: journalKeys.entries() });

    expect(await screen.findByText('Second reflection.')).toBeTruthy();
    expect(screen.getByText('First reflection.')).toBeTruthy();
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('navigates to the new entry screen', async () => {
    const repository = createMockRepository(jest.fn(async () => []) as JournalRepository['findAll']);
    await renderHome(repository);

    await screen.findByText('No entries yet. Create your first reflection.');
    await fireEvent.press(screen.getByLabelText('New Entry'));

    expect(mockPush).toHaveBeenCalledWith('/new-entry');
  });

  it('navigates to the entry detail route when an entry is pressed', async () => {
    const repository = createMockRepository(
      jest.fn(async () => [entryOne]) as JournalRepository['findAll'],
    );
    await renderHome(repository);

    const formattedDate = formatEntryDate(entryOne.createdAt);
    await fireEvent.press(
      await screen.findByLabelText(`Mood good, ${formattedDate}. First reflection.`),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/entry/[id]',
      params: { id: 'entry-1' },
    });
  });
});
