import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JournalEntryCard } from '@/components/journal-entry-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  LOAD_ENTRIES_ERROR_MESSAGE,
  useJournalEntries,
} from '@/hooks/use-journal-entries';
import { useTheme } from '@/hooks/use-theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';

export default function HomeScreen() {
  const theme = useTheme();
  const { entries, status, refreshError, reload } = useJournalEntries();

  function renderEntry({ item }: { item: JournalEntry }) {
    return <JournalEntryCard entry={item} />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Micro Journal
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.intro}>
          A small space for short reflections.
        </ThemedText>

        {status === 'loading' ? (
          <View style={styles.centeredState} accessibilityLabel="Loading entries">
            <ActivityIndicator color={theme.primary} />
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.centeredState}>
            <ThemedText themeColor="error">{LOAD_ENTRIES_ERROR_MESSAGE}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry"
              onPress={reload}
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
        ) : null}

        {status === 'ready' ? (
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
                  onPress={reload}
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
              onPress={() => router.push('/new-entry')}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}>
              <ThemedText style={[styles.ctaLabel, { color: theme.onPrimary }]}>
                New Entry
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  intro: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
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
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
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
