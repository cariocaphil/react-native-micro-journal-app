import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NewEntryActionsProps = {
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function NewEntryActions({ isSaving, onSave, onCancel }: NewEntryActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        accessibilityState={{ disabled: isSaving }}
        disabled={isSaving}
        onPress={onCancel}
        style={({ pressed }) => [
          styles.secondaryButton,
          { opacity: isSaving ? 0.5 : pressed ? 0.85 : 1 },
        ]}>
        <ThemedText themeColor="textSecondary" style={styles.secondaryLabel}>
          Cancel
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isSaving ? 'Saving' : 'Save'}
        accessibilityState={{ disabled: isSaving, busy: isSaving }}
        disabled={isSaving}
        onPress={onSave}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.primary,
            opacity: isSaving ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}>
        <ThemedText style={[styles.primaryLabel, { color: theme.onPrimary }]}>
          {isSaving ? 'Saving…' : 'Save'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: Spacing.five,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  secondaryLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
});
