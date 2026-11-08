import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { JournalEntriesReady } from '@/components/journal-entries-ready';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { LOAD_ENTRIES_ERROR_MESSAGE } from '@/hooks/use-journal-entries';
import { formatEntryDate } from '@/journal/format-entry-date';

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

describe('JournalEntriesReady', () => {
  it('shows the empty state and New Entry when there are no entries', async () => {
    const onNewEntry = jest.fn();
    await render(
      <JournalEntriesReady
        entries={[]}
        refreshError={null}
        onRetry={jest.fn()}
        onNewEntry={onNewEntry}
      />,
    );

    expect(screen.getByText('No entries yet. Create your first reflection.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('New Entry'));
    expect(onNewEntry).toHaveBeenCalledTimes(1);
  });

  it('renders entries with mood, date, and content', async () => {
    await render(
      <JournalEntriesReady
        entries={[entryTwo, entryOne]}
        refreshError={null}
        onRetry={jest.fn()}
        onNewEntry={jest.fn()}
      />,
    );

    expect(screen.getByText('Second reflection.')).toBeTruthy();
    expect(screen.getByText('First reflection.')).toBeTruthy();
    expect(screen.getByText('okay')).toBeTruthy();
    expect(screen.getByText('good')).toBeTruthy();
    expect(screen.getByText(formatEntryDate(entryTwo.createdAt))).toBeTruthy();
    expect(screen.getByText(formatEntryDate(entryOne.createdAt))).toBeTruthy();
  });

  it('shows a refresh error banner and calls onRetry', async () => {
    const onRetry = jest.fn();
    await render(
      <JournalEntriesReady
        entries={[entryOne]}
        refreshError={LOAD_ENTRIES_ERROR_MESSAGE}
        onRetry={onRetry}
        onNewEntry={jest.fn()}
      />,
    );

    expect(screen.getByText(LOAD_ENTRIES_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByText('First reflection.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
