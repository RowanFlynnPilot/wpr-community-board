import { describe, it, expect } from 'vitest';
import { toCsv } from '../src/lib/csv';

describe('toCsv', () => {
  it('quotes fields containing commas, quotes, and newlines', () => {
    const rows = [
      { title: 'Free: couch, table', body: 'She said "gone means gone".\nFirst come.' },
    ];
    const csv = toCsv(rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('"title","body"');
    expect(csv).toContain('"Free: couch, table"');
    expect(csv).toContain('"She said ""gone means gone"".\nFirst come."');
  });

  it('renders null and undefined as empty fields', () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }]);
    expect(csv.split('\r\n')[1]).toBe('"","","0"');
  });

  it('respects an explicit column order', () => {
    const csv = toCsv([{ a: 1, b: 2 }], ['b', 'a']);
    expect(csv.split('\r\n')[0]).toBe('"b","a"');
    expect(csv.split('\r\n')[1]).toBe('"2","1"');
  });

  it('produces just a header for zero rows with explicit keys', () => {
    expect(toCsv([], ['x'])).toBe('"x"');
  });
});
