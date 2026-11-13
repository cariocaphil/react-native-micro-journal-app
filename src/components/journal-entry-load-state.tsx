import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';
import { useTheme } from '@/hooks/use-theme';

type JournalEntryLoadStateProps = {
  status:
    | typeof JournalEntryDetailStatus.Loading
    | typeof JournalEntryDetailStatus.NotFound
    | typeof JournalEntryDetailStatus.Error;
  reload: () => void;
};

export function JournalEntryLoadState({ status, reload }: JournalEntryLoadStateProps) {
  const theme = useTheme();

  if (status === JournalEntryDetailStatus.Loading) {
    return (
      <View style={styles.centeredState} accessibilityLabel="Loading entry">
        <ActivityIndicator color={theme.primary} />
        <ThemedText themeColor="textSecondary">Loading…</ThemedText>
      </View>
    );
  }

  if (status === JournalEntryDetailStatus.NotFound) {
    return (
      <View style={styles.centeredState}>
        <ThemedText themeColor="textSecondary">This entry could not be found.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.centeredState}>
      <ThemedText themeColor="error">{LOAD_ENTRY_ERROR_MESSAGE}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={reload}
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
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
