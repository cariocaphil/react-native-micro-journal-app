import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import NewEntryScreen from '@/app/new-entry';
import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { PERSISTENCE_ERROR_MESSAGE } from '@/journal/new-entry-submit';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
  },
}));

const createdEntry: JournalEntry = {
  id: 'entry-1',
  content: 'A short reflection.',
  mood: 'good',
  createdAt: '2024-06-15T10:00:00.000Z',
  updatedAt: '2024-06-15T10:00:00.000Z',
};

function createMockRepository(
  createImpl?: JournalRepository['create'],
): JournalRepository {
  return {
    create: createImpl ?? (jest.fn(async () => createdEntry) as JournalRepository['create']),
    findById: jest.fn(async () => null) as JournalRepository['findById'],
    findAll: jest.fn(async () => []) as JournalRepository['findAll'],
    update: jest.fn(async () => null) as JournalRepository['update'],
    delete: jest.fn(async () => false) as JournalRepository['delete'],
  };
}

async function renderNewEntry(repository: JournalRepository) {
  return render(
    <JournalRepositoryProvider repository={repository}>
      <NewEntryScreen />
    </JournalRepositoryProvider>,
  );
}

describe('NewEntryScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('saves a valid entry and navigates back', async () => {
    const repository = createMockRepository();
    await renderNewEntry(repository);

    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'A short reflection.');
    await fireEvent.press(screen.getByLabelText('Mood good'));
    await fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => {
      expect(repository.create).toHaveBeenCalledTimes(1);
    });
    expect(repository.create).toHaveBeenCalledWith({
      content: 'A short reflection.',
      mood: 'good',
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors and does not persist invalid input', async () => {
    const repository = createMockRepository();
    await renderNewEntry(repository);

    await fireEvent.changeText(screen.getByLabelText('Journal entry'), '   ');
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(await screen.findByText('Enter a journal entry.')).toBeTruthy();
    expect(repository.create).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('shows a persistence error and stays on the screen', async () => {
    const repository = createMockRepository(
      jest.fn(async () => {
        throw new Error('write failed');
      }) as JournalRepository['create'],
    );
    await renderNewEntry(repository);

    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'A short reflection.');
    await fireEvent.press(screen.getByLabelText('Save'));

    expect(await screen.findByText(PERSISTENCE_ERROR_MESSAGE)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('prevents rapid double submissions from calling create twice', async () => {
    let resolveCreate: ((entry: JournalEntry) => void) | undefined;
    const create = jest.fn(
      () =>
        new Promise<JournalEntry>((resolve) => {
          resolveCreate = resolve;
        }),
    ) as JournalRepository['create'];
    const repository = createMockRepository(create);
    await renderNewEntry(repository);

    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'A short reflection.');
    await fireEvent.press(screen.getByLabelText('Save'));

    // While the first create is in flight, Save is disabled and the ref guard is set.
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Saving')).toBeDisabled();

    await fireEvent.press(screen.getByLabelText('Saving'));
    expect(create).toHaveBeenCalledTimes(1);

    resolveCreate?.(createdEntry);

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('cancels without saving', async () => {
    const repository = createMockRepository();
    await renderNewEntry(repository);

    await fireEvent.press(screen.getByLabelText('Cancel'));

    expect(repository.create).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
