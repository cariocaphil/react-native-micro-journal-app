import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { JournalEntryLoadState } from '@/components/journal-entry-load-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { JournalEntry } from '@/domain/journal/journal-entry';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
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

  if (
    status === JournalEntryDetailStatus.Loading ||
    status === JournalEntryDetailStatus.NotFound ||
    status === JournalEntryDetailStatus.Error
  ) {
    return <JournalEntryLoadState status={status} reload={reload} />;
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
