export const JournalRepositoryStatus = {
  Loading: 'loading',
  Ready: 'ready',
  Error: 'error',
} as const;

export type JournalRepositoryStatus =
  (typeof JournalRepositoryStatus)[keyof typeof JournalRepositoryStatus];
