import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldErrorProps = {
  message: string | undefined;
};

export function FormFieldError({ message }: FormFieldErrorProps) {
  const theme = useTheme();

  if (!message) {
    return null;
  }

  return (
    <ThemedText
      accessibilityLiveRegion="polite"
      style={[styles.errorText, { color: theme.error }]}>
      {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: Spacing.two,
    fontSize: 14,
    lineHeight: 20,
  },
});
