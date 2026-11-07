import { Pressable, StyleSheet, View } from 'react-native';

import { FormFieldError } from '@/components/form-field-error';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MOODS, type Mood } from '@/domain/journal/journal-entry';
import { useTheme } from '@/hooks/use-theme';

type MoodSelectorProps = {
  value: Mood;
  onChange: (mood: Mood) => void;
  errorMessage?: string;
  disabled?: boolean;
};

export function MoodSelector({
  value,
  onChange,
  errorMessage,
  disabled = false,
}: MoodSelectorProps) {
  const theme = useTheme();

  return (
    <>
      <ThemedText type="smallBold" style={styles.label}>
        Mood
      </ThemedText>
      <View style={styles.moodRow}>
        {MOODS.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`Mood ${option}`}
              disabled={disabled}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.moodOption,
                {
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? theme.primary : theme.inputBackground,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText
                style={[styles.moodLabel, { color: selected ? theme.onPrimary : theme.text }]}>
                {option}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <FormFieldError message={errorMessage} />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.two,
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
});
