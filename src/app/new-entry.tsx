import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PERSISTENCE_ERROR_MESSAGE,
  submitNewJournalEntry,
  type NewEntryFieldErrors,
} from '@/app/new-entry-submit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useJournalRepository } from '@/database/journal-repository-context';
import { MOODS, type Mood } from '@/domain/journal/journal-entry';
import { useTheme } from '@/hooks/use-theme';

export default function NewEntryScreen() {
  const theme = useTheme();
  const repository = useJournalRepository();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('okay');
  const [fieldErrors, setFieldErrors] = useState<NewEntryFieldErrors>({});
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  async function handleSave() {
    if (isSavingRef.current) {
      return;
    }
    if (!repository) {
      setPersistenceError(PERSISTENCE_ERROR_MESSAGE);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setFieldErrors({});
    setPersistenceError(null);

    const result = await submitNewJournalEntry(repository, { content, mood });

    if (result.status === 'validation') {
      setFieldErrors(result.fieldErrors);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    if (result.status === 'persistence') {
      setPersistenceError(result.message);
      isSavingRef.current = false;
      setIsSaving(false);
      return;
    }

    isSavingRef.current = false;
    setIsSaving(false);
    router.back();
  }

  function handleCancel() {
    if (isSavingRef.current) {
      return;
    }
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <ThemedText type="smallBold" style={styles.label}>
              Entry
            </ThemedText>
            <TextInput
              accessibilityLabel="Journal entry"
              multiline
              value={content}
              onChangeText={setContent}
              editable={!isSaving}
              placeholder="Write a short reflection…"
              placeholderTextColor={theme.textSecondary}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                  borderColor: fieldErrors.content ? theme.error : theme.border,
                },
              ]}
            />
            {fieldErrors.content ? (
              <ThemedText
                accessibilityLiveRegion="polite"
                style={[styles.errorText, { color: theme.error }]}>
                {fieldErrors.content}
              </ThemedText>
            ) : null}

            <ThemedText type="smallBold" style={styles.label}>
              Mood
            </ThemedText>
            <View style={styles.moodRow}>
              {MOODS.map((option) => {
                const selected = option === mood;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: isSaving }}
                    accessibilityLabel={`Mood ${option}`}
                    disabled={isSaving}
                    onPress={() => setMood(option)}
                    style={({ pressed }) => [
                      styles.moodOption,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.inputBackground,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.moodLabel,
                        { color: selected ? theme.onPrimary : theme.text },
                      ]}>
                      {option}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {fieldErrors.mood ? (
              <ThemedText
                accessibilityLiveRegion="polite"
                style={[styles.errorText, { color: theme.error }]}>
                {fieldErrors.mood}
              </ThemedText>
            ) : null}

            {persistenceError ? (
              <ThemedText
                accessibilityLiveRegion="polite"
                style={[styles.persistenceError, { color: theme.error }]}>
                {persistenceError}
              </ThemedText>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                accessibilityState={{ disabled: isSaving }}
                disabled={isSaving}
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { opacity: isSaving ? 0.5 : pressed ? 0.85 : 1 },
                ]}>
                <ThemedText themeColor="textSecondary" style={styles.secondaryLabel}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSaving ? 'Saving' : 'Save'}
                accessibilityState={{ disabled: isSaving, busy: isSaving }}
                disabled={isSaving}
                onPress={() => {
                  void handleSave();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSaving ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}>
                <ThemedText style={[styles.primaryLabel, { color: theme.onPrimary }]}>
                  {isSaving ? 'Saving…' : 'Save'}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    marginTop: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  moodOption: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  persistenceError: {
    marginTop: Spacing.three,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: Spacing.five,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  secondaryLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
});
