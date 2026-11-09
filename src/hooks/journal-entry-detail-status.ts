export const JournalEntryDetailStatus = {
  Loading: 'loading',
  Ready: 'ready',
  NotFound: 'notFound',
  Error: 'error',
} as const;

export type JournalEntryDetailStatus =
  (typeof JournalEntryDetailStatus)[keyof typeof JournalEntryDetailStatus];
