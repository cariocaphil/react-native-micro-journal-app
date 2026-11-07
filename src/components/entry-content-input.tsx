import { StyleSheet, TextInput } from 'react-native';

import { FormFieldError } from '@/components/form-field-error';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EntryContentInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  errorMessage?: string;
  editable?: boolean;
};

export function EntryContentInput({
  value,
  onChangeText,
  errorMessage,
  editable = true,
}: EntryContentInputProps) {
  const theme = useTheme();

  return (
    <>
      <ThemedText type="smallBold" style={styles.label}>
        Entry
      </ThemedText>
      <TextInput
        accessibilityLabel="Journal entry"
        multiline
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder="Write a short reflection…"
        placeholderTextColor={theme.textSecondary}
        textAlignVertical="top"
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.inputBackground,
            borderColor: errorMessage ? theme.error : theme.border,
          },
        ]}
      />
      <FormFieldError message={errorMessage} />
    </>
  );
}

const styles = StyleSheet.create({
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
});
