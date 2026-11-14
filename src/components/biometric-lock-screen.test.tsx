import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { useBiometricAuth, type AuthStatus } from '@/auth/biometric-auth-provider';
import { BiometricLockScreen } from '@/components/biometric-lock-screen';

const mockUnlock = jest.fn<() => Promise<void>>();
const mockClearError = jest.fn();

jest.mock('@/auth/biometric-auth-provider', () => ({
  useBiometricAuth: jest.fn(),
}));

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

const mockUseBiometricAuth = jest.mocked(useBiometricAuth);

function mockAuth(status: AuthStatus, errorMessage: string | null = null) {
  mockUseBiometricAuth.mockReturnValue({
    status,
    errorMessage,
    unlock: mockUnlock,
    clearError: mockClearError,
  });
}

describe('BiometricLockScreen', () => {
  beforeEach(() => {
    mockUnlock.mockReset();
    mockClearError.mockReset();
    mockUseBiometricAuth.mockReset();
  });

  it('shows the locked state with an Unlock button', async () => {
    mockAuth('locked');

    await render(<BiometricLockScreen />);

    expect(screen.getByRole('header', { name: 'Journal locked' })).toBeTruthy();
    expect(
      screen.getByText('Your journal is protected. Authenticate with biometrics to continue.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Unlock')).toBeTruthy();
  });

  it('calls unlock when the Unlock button is pressed', async () => {
    mockAuth('locked');
    mockUnlock.mockResolvedValue(undefined);

    await render(<BiometricLockScreen />);

    await fireEvent.press(screen.getByLabelText('Unlock'));

    expect(mockUnlock).toHaveBeenCalledTimes(1);
  });

  it('shows an error message and allows retry', async () => {
    mockAuth('locked', 'Authentication failed. Try again to unlock.');

    await render(<BiometricLockScreen />);

    expect(screen.getByText('Authentication failed. Try again to unlock.')).toBeTruthy();
    expect(screen.getByLabelText('Unlock')).toBeTruthy();
  });

  it('shows the unavailable state without an Unlock button', async () => {
    mockAuth('unavailable');

    await render(<BiometricLockScreen />);

    expect(
      screen.getByText(/Biometric authentication is not available on this device/),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Unlock')).toBeNull();
  });

  it('disables Unlock while authenticating', async () => {
    mockAuth('authenticating');

    await render(<BiometricLockScreen />);

    const button = screen.getByLabelText('Unlocking');
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });
});
