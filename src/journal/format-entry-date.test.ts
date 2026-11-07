import { describe, expect, it } from '@jest/globals';

import { formatEntryDate } from './format-entry-date';

describe('formatEntryDate', () => {
  it('formats an ISO timestamp with the given locale', () => {
    expect(formatEntryDate('2024-06-15T10:00:00.000Z', 'en-US')).toMatch(/Jun 15, 2024/);
  });
});
