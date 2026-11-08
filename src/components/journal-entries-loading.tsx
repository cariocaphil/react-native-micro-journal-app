import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function JournalEntriesLoading() {
  const theme = useTheme();

  return (
    <View style={styles.centeredState} accessibilityLabel="Loading entries">
      <ActivityIndicator color={theme.primary} />
      <ThemedText themeColor="textSecondary">Loading…</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
});
