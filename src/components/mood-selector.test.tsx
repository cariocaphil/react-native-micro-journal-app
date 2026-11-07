import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MoodSelector } from '@/components/mood-selector';
import { MOODS } from '@/domain/journal/journal-entry';

describe('MoodSelector', () => {
  it('renders a button for every mood with the current selection marked', async () => {
    await render(<MoodSelector value="okay" onChange={jest.fn()} />);

    expect(screen.getByText('Mood')).toBeTruthy();
    for (const mood of MOODS) {
      expect(screen.getByLabelText(`Mood ${mood}`)).toBeTruthy();
    }
    expect(screen.getByLabelText('Mood okay')).toBeSelected();
    expect(screen.getByLabelText('Mood good')).not.toBeSelected();
  });

  it('calls onChange with the pressed mood', async () => {
    const onChange = jest.fn();
    await render(<MoodSelector value="okay" onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Mood great'));

    expect(onChange).toHaveBeenCalledWith('great');
  });

  it('shows a validation error when provided', async () => {
    await render(
      <MoodSelector value="okay" onChange={jest.fn()} errorMessage="Select a mood." />,
    );

    expect(screen.getByText('Select a mood.')).toBeTruthy();
  });

  it('disables mood buttons and ignores presses when disabled', async () => {
    const onChange = jest.fn();
    await render(<MoodSelector value="okay" onChange={onChange} disabled />);

    const moodButton = screen.getByLabelText('Mood good');
    expect(moodButton).toBeDisabled();

    await fireEvent.press(moodButton);
    expect(onChange).not.toHaveBeenCalled();
  });
});
