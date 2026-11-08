import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { JournalEntryCard } from '@/components/journal-entry-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { useTheme } from '@/hooks/use-theme';

type JournalEntriesReadyProps = {
  entries: JournalEntry[];
  refreshError: string | null;
  onRetry: () => void;
  onNewEntry: () => void;
};

export function JournalEntriesReady({
  entries,
  refreshError,
  onRetry,
  onNewEntry,
}: JournalEntriesReadyProps) {
  const theme = useTheme();

  function renderEntry({ item }: { item: JournalEntry }) {
    return <JournalEntryCard entry={item} />;
  }

  return (
    <>
      {refreshError ? (
        <View
          style={[
            styles.refreshError,
            { borderColor: theme.error, backgroundColor: theme.inputBackground },
          ]}>
          <ThemedText themeColor="error" style={styles.refreshErrorText}>
            {refreshError}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            onPress={onRetry}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <ThemedText type="smallBold" themeColor="primary">
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {entries.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={styles.emptyState}>
          No entries yet. Create your first reflection.
        </ThemedText>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New Entry"
        onPress={onNewEntry}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <ThemedText style={[styles.ctaLabel, { color: theme.onPrimary }]}>New Entry</ThemedText>
      </Pressable>
    </>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    marginTop: Spacing.two,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  refreshError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  refreshErrorText: {
    flex: 1,
  },
  cta: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  ctaLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
});
