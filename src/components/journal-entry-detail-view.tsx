import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { LOAD_ENTRY_ERROR_MESSAGE } from '@/hooks/use-journal-entry-detail';
import { useTheme } from '@/hooks/use-theme';
import { formatEntryDate } from '@/journal/format-entry-date';

type JournalEntryDetailViewProps = {
  status: JournalEntryDetailStatus;
  entry: JournalEntry | null;
  reload: () => void;
  deleteError: string | null;
  isDeleting: boolean;
  requestDelete: () => void;
  onEdit: () => void;
};

export function JournalEntryDetailView({
  status,
  entry,
  reload,
  deleteError,
  isDeleting,
  requestDelete,
  onEdit,
}: JournalEntryDetailViewProps) {
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

  if (status === JournalEntryDetailStatus.Error) {
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

  if (status !== JournalEntryDetailStatus.Ready || !entry) {
    return null;
  }

  return (
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
        accessibilityLabel="Edit entry"
        accessibilityState={{ disabled: isDeleting }}
        disabled={isDeleting}
        onPress={onEdit}
        style={({ pressed }) => [
          styles.editButton,
          {
            borderColor: theme.border,
            opacity: isDeleting ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}>
        <ThemedText type="smallBold">Edit</ThemedText>
      </Pressable>

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
  );
}

const styles = StyleSheet.create({
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
  editButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
