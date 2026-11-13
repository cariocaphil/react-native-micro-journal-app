import { QueryClient } from '@tanstack/react-query';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}
