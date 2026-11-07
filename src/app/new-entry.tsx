import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntryContentInput } from '@/components/entry-content-input';
import { FormFieldError } from '@/components/form-field-error';
import { MoodSelector } from '@/components/mood-selector';
import { NewEntryActions } from '@/components/new-entry-actions';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNewEntryForm } from '@/hooks/use-new-entry-form';

export default function NewEntryScreen() {
  const {
    content,
    setContent,
    mood,
    setMood,
    fieldErrors,
    persistenceError,
    isSaving,
    save,
    cancel,
  } = useNewEntryForm();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <EntryContentInput
              value={content}
              onChangeText={setContent}
              errorMessage={fieldErrors.content}
              editable={!isSaving}
            />

            <MoodSelector
              value={mood}
              onChange={setMood}
              errorMessage={fieldErrors.mood}
              disabled={isSaving}
            />

            <FormFieldError message={persistenceError ?? undefined} />

            <NewEntryActions
              isSaving={isSaving}
              onSave={() => {
                void save();
              }}
              onCancel={cancel}
            />
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
});
