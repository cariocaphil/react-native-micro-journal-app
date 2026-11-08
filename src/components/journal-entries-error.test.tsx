import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { JournalEntriesError } from '@/components/journal-entries-error';
import { LOAD_ENTRIES_ERROR_MESSAGE } from '@/hooks/use-journal-entries';

describe('JournalEntriesError', () => {
  it('shows the load error message and calls onRetry when Retry is pressed', async () => {
    const onRetry = jest.fn();
    await render(<JournalEntriesError onRetry={onRetry} />);

    expect(screen.getByText(LOAD_ENTRIES_ERROR_MESSAGE)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Retry'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
