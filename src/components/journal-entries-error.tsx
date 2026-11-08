import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LOAD_ENTRIES_ERROR_MESSAGE } from '@/hooks/use-journal-entries';
import { useTheme } from '@/hooks/use-theme';

type JournalEntriesErrorProps = {
  onRetry: () => void;
};

export function JournalEntriesError({ onRetry }: JournalEntriesErrorProps) {
  const theme = useTheme();

  return (
    <View style={styles.centeredState}>
      <ThemedText themeColor="error">{LOAD_ENTRIES_ERROR_MESSAGE}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <ThemedText type="smallBold">Retry</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
