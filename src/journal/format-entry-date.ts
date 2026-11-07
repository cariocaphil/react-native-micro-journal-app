/**
 * Formats a journal entry ISO timestamp for display.
 * Pass `locale` in tests for deterministic output.
 */
export function formatEntryDate(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
