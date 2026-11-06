import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import {
  JournalRepositoryProvider,
  useJournalRepositoryStatus,
} from '@/database/journal-repository-context';

// Keep the native splash visible until the journal database is ready (or fails).
SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  // Keep splash visible while initializing — do not mount routes yet.
  if (status === 'loading') {
    return null;
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
