import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  authenticateWithBiometrics,
  getBiometricCapability,
} from '@/auth/biometric-auth';

const mockHasHardwareAsync = jest.fn<() => Promise<boolean>>();
const mockIsEnrolledAsync = jest.fn<() => Promise<boolean>>();
const mockAuthenticateAsync = jest.fn<
  () => Promise<{ success: true } | { success: false; error: string }>
>();

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: () => mockHasHardwareAsync(),
  isEnrolledAsync: () => mockIsEnrolledAsync(),
  authenticateAsync: () => mockAuthenticateAsync(),
}));

describe('getBiometricCapability', () => {
  beforeEach(() => {
    mockHasHardwareAsync.mockReset();
    mockIsEnrolledAsync.mockReset();
  });

  it('returns available when hardware exists and biometrics are enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(true);

    await expect(getBiometricCapability()).resolves.toEqual({ status: 'available' });
  });

  it('returns unavailable with no_hardware when hardware is missing', async () => {
    mockHasHardwareAsync.mockResolvedValue(false);

    await expect(getBiometricCapability()).resolves.toEqual({
      status: 'unavailable',
      reason: 'no_hardware',
    });
    expect(mockIsEnrolledAsync).not.toHaveBeenCalled();
  });

  it('returns unavailable with not_enrolled when nothing is enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(false);

    await expect(getBiometricCapability()).resolves.toEqual({
      status: 'unavailable',
      reason: 'not_enrolled',
    });
  });
});

describe('authenticateWithBiometrics', () => {
  beforeEach(() => {
    mockAuthenticateAsync.mockReset();
  });

  it('returns success when authentication succeeds', async () => {
    mockAuthenticateAsync.mockResolvedValue({ success: true });

    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'success' });
  });

  it('returns cancelled when the user cancels', async () => {
    mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'cancelled' });
  });

  it('returns cancelled for system_cancel and app_cancel', async () => {
    mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'system_cancel' });
    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'cancelled' });

    mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'app_cancel' });
    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'cancelled' });
  });

  it('returns failed when authentication fails', async () => {
    mockAuthenticateAsync.mockResolvedValue({
      success: false,
      error: 'authentication_failed',
    });

    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'failed' });
  });

  it('returns unavailable when biometrics are not available during prompt', async () => {
    mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'not_enrolled' });
    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'unavailable' });

    mockAuthenticateAsync.mockResolvedValue({ success: false, error: 'not_available' });
    await expect(authenticateWithBiometrics()).resolves.toEqual({ type: 'unavailable' });
  });

  it('returns error when authenticateAsync throws', async () => {
    mockAuthenticateAsync.mockRejectedValue(new Error('boom'));

    await expect(authenticateWithBiometrics()).resolves.toEqual({
      type: 'error',
      message: 'boom',
    });
  });

  it('returns a generic error message for non-Error throws', async () => {
    mockAuthenticateAsync.mockRejectedValue('weird');

    await expect(authenticateWithBiometrics()).resolves.toEqual({
      type: 'error',
      message: 'Unexpected authentication error',
    });
  });
});
