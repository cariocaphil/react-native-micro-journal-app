import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { useTheme } from '@/hooks/use-theme';
import { formatEntryDate } from '@/journal/format-entry-date';

type JournalEntryCardProps = {
  entry: JournalEntry;
  onPress?: () => void;
};

export function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  const theme = useTheme();
  const formattedDate = formatEntryDate(entry.createdAt);
  const accessibilityLabel = `Mood ${entry.mood}, ${formattedDate}. ${entry.content}`;

  const body = (
    <>
      <View style={styles.metaRow}>
        <ThemedText type="smallBold" style={styles.mood}>
          {entry.mood}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formattedDate}
        </ThemedText>
      </View>
      <ThemedText style={styles.content}>{entry.content}</ThemedText>
    </>
  );

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.inputBackground,
      borderColor: theme.border,
    },
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, { opacity: pressed ? 0.85 : 1 }]}>
        {body}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="summary" accessibilityLabel={accessibilityLabel} style={cardStyle}>
      {body}
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
