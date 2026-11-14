import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect, type ReactNode } from 'react';
import { AppState, Pressable, Text, type AppStateStatus } from 'react-native';

import {
  BiometricAuthProvider,
  useBiometricAuth,
  type AuthStatus,
} from '@/auth/biometric-auth-provider';

const mockGetBiometricCapability = jest.fn<() => Promise<
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'no_hardware' | 'not_enrolled' }
>>();
const mockAuthenticateWithBiometrics = jest.fn<() => Promise<
  | { type: 'success' }
  | { type: 'cancelled' }
  | { type: 'failed' }
  | { type: 'unavailable' }
  | { type: 'error'; message: string }
>>();

jest.mock('@/auth/biometric-auth', () => ({
  getBiometricCapability: () => mockGetBiometricCapability(),
  authenticateWithBiometrics: () => mockAuthenticateWithBiometrics(),
}));

type AppStateListener = (state: AppStateStatus) => void;

let appStateListener: AppStateListener | null = null;
const appStateRemoves: ReturnType<typeof jest.fn>[] = [];

jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
  appStateListener = listener as AppStateListener;
  const remove = jest.fn();
  appStateRemoves.push(remove);
  return { remove };
});

function AuthProbe({ onStatus }: { onStatus?: (status: AuthStatus) => void }) {
  const { status, errorMessage, unlock } = useBiometricAuth();

  useEffect(() => {
    onStatus?.(status);
  }, [onStatus, status]);

  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="error">{errorMessage ?? ''}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Unlock" onPress={() => void unlock()}>
        <Text>Unlock</Text>
      </Pressable>
    </>
  );
}

async function renderWithProvider(children: ReactNode) {
  return render(<BiometricAuthProvider>{children}</BiometricAuthProvider>);
}

describe('BiometricAuthProvider', () => {
  beforeEach(() => {
    mockGetBiometricCapability.mockReset();
    mockAuthenticateWithBiometrics.mockReset();
    appStateRemoves.length = 0;
    appStateListener = null;
    mockGetBiometricCapability.mockResolvedValue({ status: 'available' });
  });

  it('starts protected and becomes locked when biometrics are available', async () => {
    const statuses: AuthStatus[] = [];
    let resolveCapability: ((value: { status: 'available' }) => void) | null = null;
    mockGetBiometricCapability.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCapability = resolve;
        }),
    );

    await renderWithProvider(
      <AuthProbe
        onStatus={(status) => {
          statuses.push(status);
        }}
      />,
    );

    expect(screen.getByTestId('status').props.children).toBe('checking');

    await act(async () => {
      resolveCapability?.({ status: 'available' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    expect(statuses[0]).toBe('checking');
    expect(statuses).not.toContain('unlocked');
  });

  it('becomes unavailable when biometrics are not available', async () => {
    mockGetBiometricCapability.mockResolvedValue({
      status: 'unavailable',
      reason: 'not_enrolled',
    });

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('unavailable');
    });
  });

  it('unlocks after successful authentication', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue({ type: 'success' });

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('unlocked');
    });
  });

  it('stays locked after failed authentication', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue({ type: 'failed' });

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
      expect(screen.getByTestId('error').props.children).toBe(
        'Authentication failed. Try again to unlock.',
      );
    });
  });

  it('retries successfully after a failed attempt', async () => {
    mockAuthenticateWithBiometrics
      .mockResolvedValueOnce({ type: 'failed' })
      .mockResolvedValueOnce({ type: 'success' });

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('error').props.children).toContain('failed');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('unlocked');
    });
  });

  it('ignores a stale authentication result after background re-lock', async () => {
    let resolveAuth: ((value: { type: 'success' }) => void) | null = null;
    mockAuthenticateWithBiometrics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuth = resolve;
        }),
    );

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('authenticating');
    });

    await act(async () => {
      appStateListener?.('background');
    });

    expect(screen.getByTestId('status').props.children).toBe('locked');

    await act(async () => {
      resolveAuth?.({ type: 'success' });
    });

    expect(screen.getByTestId('status').props.children).toBe('locked');
  });

  it('prevents duplicate authentication prompts while authenticating', async () => {
    let resolveAuth: ((value: { type: 'success' }) => void) | null = null;
    mockAuthenticateWithBiometrics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuth = resolve;
        }),
    );

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));
    await fireEvent.press(screen.getByLabelText('Unlock'));

    expect(mockAuthenticateWithBiometrics).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAuth?.({ type: 'success' });
    });
  });

  it('requires authentication again after returning from background', async () => {
    mockAuthenticateWithBiometrics.mockResolvedValue({ type: 'success' });

    await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    await fireEvent.press(screen.getByLabelText('Unlock'));

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('unlocked');
    });

    await act(async () => {
      appStateListener?.('inactive');
    });

    expect(screen.getByTestId('status').props.children).toBe('unlocked');

    await act(async () => {
      appStateListener?.('background');
    });

    expect(screen.getByTestId('status').props.children).toBe('locked');
  });

  it('removes the AppState listener on unmount', async () => {
    const view = await renderWithProvider(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('locked');
    });

    expect(appStateRemoves.length).toBeGreaterThan(0);

    await act(async () => {
      view.unmount();
    });

    expect(appStateRemoves.every((remove) => remove.mock.calls.length > 0)).toBe(true);
  });
});
