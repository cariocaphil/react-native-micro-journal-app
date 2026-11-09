/**
 * Normalizes an Expo Router route param into a usable entry id.
 * Returns null for missing, empty, or whitespace-only values.
 */
export function normalizeEntryId(id: string | string[] | undefined): string | null {
  const raw = Array.isArray(id) ? id[0] : id;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
