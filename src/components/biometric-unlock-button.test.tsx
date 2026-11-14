import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { BiometricUnlockButton } from '@/components/biometric-unlock-button';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#000000',
    background: '#ffffff',
    textSecondary: '#60646C',
    primary: '#1B6BC7',
    onPrimary: '#ffffff',
    border: '#C8CCD2',
    inputBackground: '#F4F5F7',
    error: '#B42318',
  }),
}));

describe('BiometricUnlockButton', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    onPress.mockReset();
  });

  it('calls onPress when pressed', async () => {
    await render(<BiometricUnlockButton isAuthenticating={false} onPress={onPress} />);

    await fireEvent.press(screen.getByLabelText('Unlock'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disables and shows Unlocking while authenticating', async () => {
    await render(<BiometricUnlockButton isAuthenticating onPress={onPress} />);

    const button = screen.getByLabelText('Unlocking');
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(screen.getByText('Unlocking…')).toBeTruthy();
  });
});
