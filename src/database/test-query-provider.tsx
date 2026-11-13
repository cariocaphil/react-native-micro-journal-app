import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { JournalRepository } from '@/database/journal-repository';
import { JournalRepositoryProvider } from '@/database/journal-repository-context';
import { createTestQueryClient } from '@/database/query-client';

export function createRepositoryQueryWrapper(repository: JournalRepository) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <JournalRepositoryProvider repository={repository}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </JournalRepositoryProvider>
    );
  }

  return { Wrapper, queryClient };
}
