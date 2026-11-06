import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Micro Journal
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.intro}>
          A small space for short reflections.
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.emptyState}>
          No entries yet
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New Entry"
          onPress={() => router.push('/new-entry')}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <ThemedText style={[styles.ctaLabel, { color: theme.onPrimary }]}>New Entry</ThemedText>
        </Pressable>
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
  intro: {
    marginTop: Spacing.two,
  },
  emptyState: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
  },
  ctaLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 600,
  },
});
