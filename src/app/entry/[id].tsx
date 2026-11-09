import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { useTheme } from '@/hooks/use-theme';
import {
  LOAD_ENTRY_ERROR_MESSAGE,
  useJournalEntryDetail,
} from '@/hooks/use-journal-entry-detail';
import { formatEntryDate } from '@/journal/format-entry-date';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const theme = useTheme();
  const { entry, status, deleteError, isDeleting, reload, requestDelete } =
    useJournalEntryDetail(id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        {status === JournalEntryDetailStatus.Loading ? (
          <View style={styles.centeredState} accessibilityLabel="Loading entry">
            <ActivityIndicator color={theme.primary} />
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          </View>
        ) : null}

        {status === JournalEntryDetailStatus.NotFound ? (
          <View style={styles.centeredState}>
            <ThemedText themeColor="textSecondary">
              This entry could not be found.
            </ThemedText>
          </View>
        ) : null}

        {status === JournalEntryDetailStatus.Error ? (
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
        ) : null}

        {status === JournalEntryDetailStatus.Ready && entry ? (
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText type="smallBold" style={styles.mood}>
              {entry.mood}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Created {formatEntryDate(entry.createdAt)}
            </ThemedText>
            {entry.updatedAt !== entry.createdAt ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.updated}>
                Updated {formatEntryDate(entry.updatedAt)}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.body}>{entry.content}</ThemedText>

            {deleteError ? (
              <ThemedText themeColor="error" style={styles.deleteError}>
                {deleteError}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDeleting ? 'Deleting' : 'Delete entry'}
              accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
              disabled={isDeleting}
              onPress={requestDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  borderColor: theme.error,
                  opacity: isDeleting ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText type="smallBold" themeColor="error">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </ThemedText>
            </Pressable>
          </ScrollView>
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
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  content: {
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  mood: {
    textTransform: 'capitalize',
  },
  updated: {
    marginTop: Spacing.one,
  },
  body: {
    marginTop: Spacing.three,
  },
  deleteError: {
    marginTop: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
