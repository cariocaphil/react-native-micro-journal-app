import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import {
  JournalRepositoryProvider,
  useJournalRepositoryStatus,
} from '@/database/journal-repository-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.textSecondary,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <JournalRepositoryProvider>
        <RootNavigator />
      </JournalRepositoryProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status } = useJournalRepositoryStatus();

  if (status === 'loading') {
    return (
      <ThemedView style={styles.statusContainer}>
        <SafeAreaView style={styles.statusSafeArea}>
          <ActivityIndicator accessibilityLabel="Loading journal" />
          <ThemedText themeColor="textSecondary" style={styles.statusText}>
            Loading…
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (status === 'error') {
    return (
      <ThemedView style={styles.statusContainer}>
        <SafeAreaView style={styles.statusSafeArea}>
          <ThemedText accessibilityRole="header" type="subtitle">
            Unable to open journal
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.statusText}>
            The journal database could not be opened. Please restart the app and try again.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Micro Journal' }} />
      <Stack.Screen name="new-entry" options={{ title: 'New Entry' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    flex: 1,
  },
  statusSafeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  statusText: {
    marginTop: Spacing.two,
  },
});
