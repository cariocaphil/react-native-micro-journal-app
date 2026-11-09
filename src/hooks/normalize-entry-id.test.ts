import { describe, expect, it } from '@jest/globals';

import { normalizeEntryId } from '@/hooks/normalize-entry-id';

describe('normalizeEntryId', () => {
  it('returns trimmed string ids', () => {
    expect(normalizeEntryId(' entry-1 ')).toBe('entry-1');
  });

  it('uses the first array element', () => {
    expect(normalizeEntryId(['entry-1', 'entry-2'])).toBe('entry-1');
  });

  it('returns null for missing, empty, or whitespace-only values', () => {
    expect(normalizeEntryId(undefined)).toBeNull();
    expect(normalizeEntryId('')).toBeNull();
    expect(normalizeEntryId('   ')).toBeNull();
    expect(normalizeEntryId([])).toBeNull();
  });
});
