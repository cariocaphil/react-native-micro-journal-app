import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditEntryForm } from '@/components/edit-entry-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { JournalEntryDetailStatus } from '@/hooks/journal-entry-detail-status';
import { LOAD_ENTRY_ERROR_MESSAGE, useJournalEntryDetail } from '@/hooks/use-journal-entry-detail';
import { useTheme } from '@/hooks/use-theme';

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { entry, status, reload } = useJournalEntryDetail(id);
  const theme = useTheme();

  if (status === JournalEntryDetailStatus.Loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.centeredSafeArea}>
          <View style={styles.centeredState} accessibilityLabel="Loading entry">
            <ActivityIndicator color={theme.primary} />
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (status === JournalEntryDetailStatus.NotFound) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.centeredSafeArea}>
          <View style={styles.centeredState}>
            <ThemedText themeColor="textSecondary">This entry could not be found.</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (status === JournalEntryDetailStatus.Error) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.centeredSafeArea}>
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
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
