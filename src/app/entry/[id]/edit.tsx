import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditEntryForm } from '@/components/edit-entry-form';
import { JournalEntryLoadState } from '@/components/journal-entry-load-state';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { useJournalEntryDetail } from '@/hooks/use-journal-entry-detail';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { entry, status, reload } = useJournalEntryDetail(id);

  if (
    status === JournalEntryDetailStatus.Loading ||
    status === JournalEntryDetailStatus.NotFound ||
    status === JournalEntryDetailStatus.Error
  ) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.centeredSafeArea}>
          <JournalEntryLoadState status={status} reload={reload} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (status !== JournalEntryDetailStatus.Ready || !entry) {
    return null;
  }

  return (
    <EditEntryForm
      key={entry.id}
      id={entry.id}
      initialContent={entry.content}
      initialMood={entry.mood}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredSafeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
