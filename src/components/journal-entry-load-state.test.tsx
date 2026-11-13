import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { JournalEntryLoadState } from '@/components/journal-entry-load-state';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';

describe('JournalEntryLoadState', () => {
  it('shows the loading state', async () => {
    await render(
      <JournalEntryLoadState
        status={JournalEntryDetailStatus.Loading}
        reload={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Loading entry')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows not-found copy', async () => {
    await render(
      <JournalEntryLoadState
        status={JournalEntryDetailStatus.NotFound}
        reload={jest.fn()}
      />,
    );

    expect(screen.getByText('This entry could not be found.')).toBeTruthy();
  });

  it('shows a load error and calls reload on Retry', async () => {
    const reload = jest.fn();
    await render(
      <JournalEntryLoadState status={JournalEntryDetailStatus.Error} reload={reload} />,
    );

    expect(screen.getByText(LOAD_ENTRY_ERROR_MESSAGE)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Retry'));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
