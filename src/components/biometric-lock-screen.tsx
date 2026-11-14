import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBiometricAuth } from '@/auth/biometric-auth-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BiometricLockScreen() {
  const theme = useTheme();
  const { status, errorMessage, unlock } = useBiometricAuth();

  const isUnavailable = status === 'unavailable';
  const isBusy = status === 'checking' || status === 'authenticating';
  const canUnlock = status === 'locked' || status === 'authenticating';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText accessibilityRole="header" type="subtitle">
          Journal locked
        </ThemedText>

        {isUnavailable ? (
          <ThemedText themeColor="textSecondary" style={styles.message}>
            Biometric authentication is not available on this device. Enroll Face ID,
            Touch ID, or a fingerprint in your system settings, then restart the app.
          </ThemedText>
        ) : (
          <>
            <ThemedText themeColor="textSecondary" style={styles.message}>
              Your journal is protected. Authenticate with biometrics to continue.
            </ThemedText>

            {errorMessage ? (
              <ThemedText
                themeColor="error"
                accessibilityLiveRegion="polite"
                style={styles.error}>
                {errorMessage}
              </ThemedText>
            ) : null}

            {canUnlock ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={status === 'authenticating' ? 'Unlocking' : 'Unlock'}
                accessibilityState={{ disabled: isBusy, busy: status === 'authenticating' }}
                disabled={isBusy}
                onPress={() => void unlock()}
                style={({ pressed }) => [
                  styles.unlockButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isBusy ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}>
                <ThemedText style={[styles.unlockLabel, { color: theme.onPrimary }]}>
                  {status === 'authenticating' ? 'Unlocking…' : 'Unlock'}
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  message: {
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.one,
  },
  unlockButton: {
    marginTop: Spacing.four,
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  unlockLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
});
