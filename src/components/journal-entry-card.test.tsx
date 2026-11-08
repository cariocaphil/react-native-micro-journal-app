import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { JournalEntryCard } from '@/components/journal-entry-card';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { formatEntryDate } from '@/journal/format-entry-date';

const entry: JournalEntry = {
  id: 'entry-1',
  content: 'A quiet morning walk.',
  mood: 'great',
  createdAt: '2024-06-15T12:00:00.000Z',
  updatedAt: '2024-06-15T12:00:00.000Z',
};

describe('JournalEntryCard', () => {
  it('renders mood, formatted date, and content', async () => {
    await render(<JournalEntryCard entry={entry} />);

    expect(screen.getByText('great')).toBeTruthy();
    expect(screen.getByText(formatEntryDate(entry.createdAt))).toBeTruthy();
    expect(screen.getByText('A quiet morning walk.')).toBeTruthy();
  });

  it('exposes an accessibility summary that includes mood, date, and content', async () => {
    await render(<JournalEntryCard entry={entry} />);

    const formattedDate = formatEntryDate(entry.createdAt);
    expect(
      screen.getByLabelText(`Mood great, ${formattedDate}. A quiet morning walk.`),
    ).toBeTruthy();
  });
});
