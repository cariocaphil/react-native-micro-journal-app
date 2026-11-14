import { StyleSheet } from 'react-native';

import type { AuthStatus } from '@/auth/biometric-auth-provider';
import { BiometricUnlockButton } from '@/components/biometric-unlock-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type BiometricLockContentProps = {
  status: AuthStatus;
  errorMessage: string | null;
  onUnlock: () => void;
};

export function BiometricLockContent({
  status,
  errorMessage,
  onUnlock,
}: BiometricLockContentProps) {
  if (status === 'unavailable') {
    return (
      <ThemedText themeColor="textSecondary" style={styles.message}>
        Biometric authentication is not available on this device. Enroll Face ID,
        Touch ID, or a fingerprint in your system settings, then restart the app.
      </ThemedText>
    );
  }

  const canUnlock = status === 'locked' || status === 'authenticating';

  return (
    <>
      <ThemedText themeColor="textSecondary" style={styles.message}>
        Your journal is protected. Authenticate with biometrics to continue.
      </ThemedText>

      {errorMessage ? (
        <ThemedText themeColor="error" accessibilityLiveRegion="polite" style={styles.error}>
          {errorMessage}
        </ThemedText>
      ) : null}

      {canUnlock ? (
        <BiometricUnlockButton
          isAuthenticating={status === 'authenticating'}
          onPress={onUnlock}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  message: {
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.one,
  },
});
