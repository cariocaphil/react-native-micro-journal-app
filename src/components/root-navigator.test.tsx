import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';

import { useBiometricAuth } from '@/auth/biometric-auth-provider';
import { RootNavigator } from '@/components/root-navigator';
import { useJournalRepositoryStatus } from '@/database/journal-repository-context';
import { JournalRepositoryStatus } from '@/database/journal-repository-status';

const mockHideAsync = jest.fn(() => Promise.resolve());

jest.mock('expo-splash-screen', () => ({
  hideAsync: () => mockHideAsync(),
}));

jest.mock('expo-router', () => {
  const React = require('react') as typeof import('react');
  const { Text } = require('react-native') as typeof import('react-native');

  function Stack() {
    return React.createElement(Text, null, 'App stack');
  }
  Stack.Screen = function StackScreen() {
    return null;
  };
  return { Stack };
});

jest.mock('@/database/journal-repository-context', () => ({
  useJournalRepositoryStatus: jest.fn(),
}));

jest.mock('@/auth/biometric-auth-provider', () => ({
  useBiometricAuth: jest.fn(),
}));

jest.mock('@/components/biometric-lock-screen', () => {
  const React = require('react') as typeof import('react');
  const { Text } = require('react-native') as typeof import('react-native');

  return {
    BiometricLockScreen: function BiometricLockScreen() {
      return React.createElement(Text, null, 'Biometric lock screen');
    },
  };
});

const mockUseJournalRepositoryStatus = jest.mocked(useJournalRepositoryStatus);
const mockUseBiometricAuth = jest.mocked(useBiometricAuth);

function mockAuth(status: 'checking' | 'locked' | 'authenticating' | 'unlocked' | 'unavailable') {
  mockUseBiometricAuth.mockReturnValue({
    status,
    errorMessage: null,
    unlock: jest.fn(async () => undefined),
    clearError: jest.fn(),
  });
}

describe('RootNavigator', () => {
  beforeEach(() => {
    mockHideAsync.mockClear();
    mockUseJournalRepositoryStatus.mockReset();
    mockUseBiometricAuth.mockReset();
    mockAuth('unlocked');
  });

  it('renders nothing and keeps the splash while loading', async () => {
    mockUseJournalRepositoryStatus.mockReturnValue({
      status: JournalRepositoryStatus.Loading,
      repository: null,
      error: null,
    });

    const view = await render(<RootNavigator />);

    expect(view.toJSON()).toBeNull();
    expect(screen.queryByText('Unable to open journal')).toBeNull();
    expect(screen.queryByText('App stack')).toBeNull();
    expect(screen.queryByText('Biometric lock screen')).toBeNull();
    expect(mockHideAsync).not.toHaveBeenCalled();
  });

  it('shows the database error screen and hides the splash on error', async () => {
    mockUseJournalRepositoryStatus.mockReturnValue({
      status: JournalRepositoryStatus.Error,
      repository: null,
      error: new Error('open failed'),
    });

    await render(<RootNavigator />);

    expect(screen.getByText('Unable to open journal')).toBeTruthy();
    expect(screen.queryByText('App stack')).toBeNull();
    expect(screen.queryByText('Biometric lock screen')).toBeNull();
    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the lock screen instead of the stack while locked', async () => {
    mockUseJournalRepositoryStatus.mockReturnValue({
      status: JournalRepositoryStatus.Ready,
      repository: {} as never,
      error: null,
    });
    mockAuth('locked');

    await render(<RootNavigator />);

    expect(screen.getByText('Biometric lock screen')).toBeTruthy();
    expect(screen.queryByText('App stack')).toBeNull();
    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the app stack and hides the splash when ready and unlocked', async () => {
    mockUseJournalRepositoryStatus.mockReturnValue({
      status: JournalRepositoryStatus.Ready,
      repository: {} as never,
      error: null,
    });
    mockAuth('unlocked');

    await render(<RootNavigator />);

    expect(screen.getByText('App stack')).toBeTruthy();
    expect(screen.queryByText('Unable to open journal')).toBeNull();
    expect(screen.queryByText('Biometric lock screen')).toBeNull();
    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalledTimes(1);
    });
  });
});
