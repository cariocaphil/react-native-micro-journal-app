import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { BiometricAuthProvider } from '@/auth/biometric-auth-provider';
import { RootNavigator } from '@/components/root-navigator';
import { Colors } from '@/constants/theme';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import { createAppQueryClient } from '@/database/query-client';

// Keep the native splash visible until the journal database is ready (or fails).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const [queryClient] = useState(() => createAppQueryClient());

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
        <QueryClientProvider client={queryClient}>
          <BiometricAuthProvider>
            <RootNavigator />
          </BiometricAuthProvider>
        </QueryClientProvider>
      </JournalRepositoryProvider>
    </ThemeProvider>
  );
}
