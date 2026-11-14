import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBiometricAuth } from '@/auth/biometric-auth-provider';
import { BiometricLockContent } from '@/components/biometric-lock-content';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function BiometricLockScreen() {
  const { status, errorMessage, unlock } = useBiometricAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText accessibilityRole="header" type="subtitle">
          Journal locked
        </ThemedText>
        <BiometricLockContent
          status={status}
          errorMessage={errorMessage}
          onUnlock={() => void unlock()}
        />
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
});
