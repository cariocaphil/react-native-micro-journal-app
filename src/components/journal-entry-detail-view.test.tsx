import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { JournalEntryDetailView } from '@/components/journal-entry-detail-view';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';
import { formatEntryDate } from '@/journal/format-entry-date';

const entry: JournalEntry = {
  id: 'entry-1',
  content: 'A full journal reflection.',
  mood: 'good',
  createdAt: '2024-06-15T12:00:00.000Z',
  updatedAt: '2024-06-15T13:00:00.000Z',
};

describe('JournalEntryDetailView', () => {
  it('renders mood, dates, and content when ready', async () => {
    await render(
      <JournalEntryDetailView
        status={JournalEntryDetailStatus.Ready}
        entry={entry}
        reload={jest.fn()}
        deleteError={null}
        isDeleting={false}
        requestDelete={jest.fn()}
        onEdit={jest.fn()}
      />,
    );

    expect(screen.getByText('good')).toBeTruthy();
    expect(screen.getByText(`Created ${formatEntryDate(entry.createdAt)}`)).toBeTruthy();
    expect(screen.getByText(`Updated ${formatEntryDate(entry.updatedAt)}`)).toBeTruthy();
    expect(screen.getByText('A full journal reflection.')).toBeTruthy();
  });

  it('shows not-found copy', async () => {
    await render(
      <JournalEntryDetailView
        status={JournalEntryDetailStatus.NotFound}
        entry={null}
        reload={jest.fn()}
        deleteError={null}
        isDeleting={false}
        requestDelete={jest.fn()}
        onEdit={jest.fn()}
      />,
    );

    expect(screen.getByText('This entry could not be found.')).toBeTruthy();
  });

  it('shows a load error and calls reload on Retry', async () => {
    const reload = jest.fn();
    await render(
      <JournalEntryDetailView
        status={JournalEntryDetailStatus.Error}
        entry={null}
        reload={reload}
        deleteError={null}
        isDeleting={false}
        requestDelete={jest.fn()}
        onEdit={jest.fn()}
      />,
    );

    expect(screen.getByText(LOAD_ENTRY_ERROR_MESSAGE)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when Edit is pressed', async () => {
    const onEdit = jest.fn();
    await render(
      <JournalEntryDetailView
        status={JournalEntryDetailStatus.Ready}
        entry={entry}
        reload={jest.fn()}
        deleteError={null}
        isDeleting={false}
        requestDelete={jest.fn()}
        onEdit={onEdit}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Edit entry'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls requestDelete when Delete is pressed', async () => {
    const requestDelete = jest.fn();
    await render(
      <JournalEntryDetailView
        status={JournalEntryDetailStatus.Ready}
        entry={entry}
        reload={jest.fn()}
        deleteError={null}
        isDeleting={false}
        requestDelete={requestDelete}
        onEdit={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Delete entry'));
    expect(requestDelete).toHaveBeenCalledTimes(1);
  });
});
