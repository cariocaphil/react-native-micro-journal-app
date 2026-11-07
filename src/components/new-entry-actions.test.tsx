import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NewEntryActions } from '@/components/new-entry-actions';

describe('NewEntryActions', () => {
  it('invokes onSave and onCancel when idle', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    await render(<NewEntryActions isSaving={false} onSave={onSave} onCancel={onCancel} />);

    await fireEvent.press(screen.getByLabelText('Save'));
    await fireEvent.press(screen.getByLabelText('Cancel'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a saving label and disables both actions while saving', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    await render(<NewEntryActions isSaving onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.getByLabelText('Saving')).toBeDisabled();
    expect(screen.getByLabelText('Cancel')).toBeDisabled();

    await fireEvent.press(screen.getByLabelText('Saving'));
    await fireEvent.press(screen.getByLabelText('Cancel'));

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
