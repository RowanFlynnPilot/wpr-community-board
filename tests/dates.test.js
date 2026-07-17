import { describe, it, expect } from 'vitest';
import { formatEventDate, formatStamp } from '../src/lib/dates';

describe('formatEventDate', () => {
  // The classic off-by-one: new Date('2026-06-18') is UTC midnight, which
  // is still June 17 in Wausau. The formatter must parse as a local date.
  it('shows the date the submitter picked, not the previous day', () => {
    expect(formatEventDate('2026-06-18')).toBe('Thu, Jun 18');
  });

  it('handles the first of the month', () => {
    expect(formatEventDate('2026-07-01')).toBe('Wed, Jul 1');
  });

  it('follows the board language locale', () => {
    expect(formatEventDate('2026-06-18', 'es-US')).toMatch(/jue/i);
    expect(formatEventDate('2026-06-18', 'es-US')).toMatch(/jun/i);
  });
});

describe('formatStamp', () => {
  it('renders the uppercase stamp date', () => {
    expect(formatStamp('2026-06-09T15:30:00Z')).toMatch(/^JUN \d{1,2}$/);
  });
});
