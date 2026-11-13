export const journalKeys = {
  all: ['journal'] as const,
  entries: () => [...journalKeys.all, 'entries'] as const,
  entry: (id: string) => [...journalKeys.all, 'entry', id] as const,
};
