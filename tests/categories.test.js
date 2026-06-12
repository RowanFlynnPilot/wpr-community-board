import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { CATEGORIES, CATEGORY_KEYS } from '../src/lib/categories';

// Categories live in two places by necessity: the Postgres enum (source of
// truth) and the display map. This is the tripwire for the day someone adds
// one without the other.
describe('category display map matches the Postgres enum', () => {
  const sql = readFileSync(new URL('../supabase/migrations/001_init.sql', import.meta.url), 'utf8');
  const enumMatch = sql.match(/create type post_category as enum \(([\s\S]*?)\);/);
  const enumValues = enumMatch[1].match(/'([^']+)'/g).map((v) => v.slice(1, -1));

  it('covers every enum value, in enum order', () => {
    expect(CATEGORY_KEYS).toEqual(enumValues);
  });

  it('gives every category a label and a dot color', () => {
    for (const key of CATEGORY_KEYS) {
      expect(CATEGORIES[key].label).toBeTruthy();
      expect(CATEGORIES[key].dot).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
