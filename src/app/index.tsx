import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JournalEntriesError } from '@/components/journal-entries-error';
import { JournalEntriesLoading } from '@/components/journal-entries-loading';
import { JournalEntriesReady } from '@/components/journal-entries-ready';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { JournalEntriesStatus } from '@/hooks/journal-entries-status';
import { useJournalEntries } from '@/hooks/use-journal-entries';

export default function HomeScreen() {
  const { entries, status, refreshError, reload } = useJournalEntries();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Micro Journal
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.intro}>
          A small space for short reflections.
        </ThemedText>

        {status === JournalEntriesStatus.Loading ? <JournalEntriesLoading /> : null}
        {status === JournalEntriesStatus.Error ? (
          <JournalEntriesError onRetry={reload} />
        ) : null}
        {status === JournalEntriesStatus.Ready ? (
          <JournalEntriesReady
            entries={entries}
            refreshError={refreshError}
            onRetry={reload}
            onNewEntry={() => router.push('/new-entry')}
          />
        ) : null}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  intro: {
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
});
