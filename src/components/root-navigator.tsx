import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { JournalDatabaseErrorScreen } from '@/components/journal-database-error-screen';
import { useJournalRepositoryStatus } from '@/database/journal-repository-context';
import { JournalRepositoryStatus } from '@/database/journal-repository-status';

export function RootNavigator() {
  const { status } = useJournalRepositoryStatus();

  useEffect(() => {
    if (
      status === JournalRepositoryStatus.Ready ||
      status === JournalRepositoryStatus.Error
    ) {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  // Keep splash visible while initializing — do not mount routes yet.
  if (status === JournalRepositoryStatus.Loading) {
    return null;
  }

  if (status === JournalRepositoryStatus.Error) {
    return <JournalDatabaseErrorScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Micro Journal' }} />
      <Stack.Screen name="new-entry" options={{ title: 'New Entry' }} />
      <Stack.Screen name="entry/[id]" options={{ title: 'Entry' }} />
    </Stack>
  );
}
