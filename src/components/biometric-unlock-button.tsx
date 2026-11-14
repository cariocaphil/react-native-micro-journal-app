import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BiometricUnlockButtonProps = {
  isAuthenticating: boolean;
  onPress: () => void;
};

export function BiometricUnlockButton({
  isAuthenticating,
  onPress,
}: BiometricUnlockButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isAuthenticating ? 'Unlocking' : 'Unlock'}
      accessibilityState={{ disabled: isAuthenticating, busy: isAuthenticating }}
      disabled={isAuthenticating}
      onPress={onPress}
      style={({ pressed }) => [
        styles.unlockButton,
        {
          backgroundColor: theme.primary,
          opacity: isAuthenticating ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText style={[styles.unlockLabel, { color: theme.onPrimary }]}>
        {isAuthenticating ? 'Unlocking…' : 'Unlock'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
