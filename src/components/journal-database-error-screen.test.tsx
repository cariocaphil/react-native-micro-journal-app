import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { JournalDatabaseErrorScreen } from '@/components/journal-database-error-screen';

describe('JournalDatabaseErrorScreen', () => {
  it('renders the unable-to-open title and recovery message', async () => {
    await render(<JournalDatabaseErrorScreen />);

    expect(screen.getByRole('header', { name: 'Unable to open journal' })).toBeTruthy();
    expect(
      screen.getByText(
        'The journal database could not be opened. Please restart the app and try again.',
      ),
    ).toBeTruthy();
  });
});
