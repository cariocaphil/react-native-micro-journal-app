import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricCapability =
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'no_hardware' | 'not_enrolled' };

export type BiometricAuthResult =
  | { type: 'success' }
  | { type: 'cancelled' }
  | { type: 'failed' }
  | { type: 'unavailable' }
  | { type: 'error'; message: string };

const CANCELLED_ERRORS = new Set([
  'user_cancel',
  'system_cancel',
  'app_cancel',
]);

const UNAVAILABLE_ERRORS = new Set([
  'not_enrolled',
  'not_available',
  'passcode_not_set',
]);

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { status: 'unavailable', reason: 'no_hardware' };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return { status: 'unavailable', reason: 'not_enrolled' };
  }

  return { status: 'available' };
}

export async function authenticateWithBiometrics(): Promise<BiometricAuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your journal',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return { type: 'success' };
    }

    const error = result.error;

    if (CANCELLED_ERRORS.has(error)) {
      return { type: 'cancelled' };
    }

    if (UNAVAILABLE_ERRORS.has(error)) {
      return { type: 'unavailable' };
    }

    return { type: 'failed' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected authentication error';
    return { type: 'error', message };
  }
}
