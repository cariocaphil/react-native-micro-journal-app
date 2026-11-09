import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JournalEntryDetailView } from '@/components/journal-entry-detail-view';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useJournalEntryDelete } from '@/hooks/use-journal-entry-delete';
import { useJournalEntryDetail } from '@/hooks/use-journal-entry-detail';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { entry, status, reload } = useJournalEntryDetail(id);
  const { deleteError, isDeleting, requestDelete } = useJournalEntryDelete(id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <JournalEntryDetailView
          status={status}
          entry={entry}
          reload={reload}
          deleteError={deleteError}
          isDeleting={isDeleting}
          requestDelete={requestDelete}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
