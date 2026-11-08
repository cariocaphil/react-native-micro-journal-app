export const JournalEntriesStatus = {
  Loading: 'loading',
  Ready: 'ready',
  Error: 'error',
} as const;

export type JournalEntriesStatus =
  (typeof JournalEntriesStatus)[keyof typeof JournalEntriesStatus];
