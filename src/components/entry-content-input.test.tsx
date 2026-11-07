import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { EntryContentInput } from '@/components/entry-content-input';

describe('EntryContentInput', () => {
  it('renders the labeled journal entry field with the current value', async () => {
    await render(
      <EntryContentInput value="A short reflection." onChangeText={jest.fn()} />,
    );

    expect(screen.getByText('Entry')).toBeTruthy();
    expect(screen.getByLabelText('Journal entry')).toHaveDisplayValue('A short reflection.');
  });

  it('calls onChangeText when the user types', async () => {
    const onChangeText = jest.fn();
    await render(<EntryContentInput value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Journal entry'), 'Hello journal');

    expect(onChangeText).toHaveBeenCalledWith('Hello journal');
  });

  it('shows a validation error message when provided', async () => {
    await render(
      <EntryContentInput
        value=""
        onChangeText={jest.fn()}
        errorMessage="Enter a journal entry."
      />,
    );

    expect(screen.getByText('Enter a journal entry.')).toBeTruthy();
  });

  it('does not show an error message when none is provided', async () => {
    await render(<EntryContentInput value="ok" onChangeText={jest.fn()} />);

    expect(screen.queryByText('Enter a journal entry.')).toBeNull();
  });

  it('disables editing when editable is false', async () => {
    await render(
      <EntryContentInput value="Locked" onChangeText={jest.fn()} editable={false} />,
    );

    expect(screen.getByLabelText('Journal entry')).toBeDisabled();
  });
});
