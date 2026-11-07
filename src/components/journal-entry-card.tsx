import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { useTheme } from '@/hooks/use-theme';
import { formatEntryDate } from '@/journal/format-entry-date';

type JournalEntryCardProps = {
  entry: JournalEntry;
};

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const theme = useTheme();
  const formattedDate = formatEntryDate(entry.createdAt);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Mood ${entry.mood}, ${formattedDate}. ${entry.content}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.metaRow}>
        <ThemedText type="smallBold" style={styles.mood}>
          {entry.mood}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formattedDate}
        </ThemedText>
      </View>
      <ThemedText style={styles.content}>{entry.content}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  mood: {
    textTransform: 'capitalize',
  },
  content: {
    flexShrink: 1,
  },
});
