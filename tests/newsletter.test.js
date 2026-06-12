import { describe, it, expect } from 'vitest';
import { escapeHtml, newsletterHtml } from '../src/lib/newsletter';

const BASE = 'https://example.org/board/';

let nextId = 0;

function post(overrides = {}) {
  return {
    id: `0000000-fixture-${nextId++}`,
    title: 'A note',
    body: 'Short body.',
    is_pinned: false,
    published_at: '2026-06-10T12:00:00Z',
    ...overrides,
  };
}

describe('newsletterHtml', () => {
  it('puts pinned picks first, then newest', () => {
    const html = newsletterHtml(
      [
        post({ title: 'Newest', published_at: '2026-06-11T12:00:00Z' }),
        post({ title: 'Pinned', is_pinned: true, published_at: '2026-06-01T12:00:00Z' }),
        post({ title: 'Older', published_at: '2026-06-05T12:00:00Z' }),
      ],
      BASE
    );
    const order = ['Pinned', 'Newest', 'Older'].map((t) => html.indexOf(t));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('caps the list at five items', () => {
    const posts = Array.from({ length: 8 }, (_, i) => post({ title: `Note ${i}` }));
    const html = newsletterHtml(posts, BASE);
    expect(html.match(/<li>/g)).toHaveLength(5);
  });

  it('escapes HTML in titles and bodies', () => {
    const html = newsletterHtml(
      [post({ title: '<script>alert(1)</script>', body: 'Fish & chips <free>' })],
      BASE
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Fish &amp; chips &lt;free&gt;');
  });

  it('truncates long bodies into a teaser and links every item to its card', () => {
    const longBody = 'word '.repeat(40).trim();
    const html = newsletterHtml([post({ id: 'abc123', body: longBody })], BASE);
    expect(html).toContain('…');
    expect(html).toContain(`${BASE}#post-abc123`);
    expect(html).toContain(`<a href="${BASE}">`);
  });
});

describe('escapeHtml', () => {
  it('handles text and attribute contexts', () => {
    expect(escapeHtml('a & b < c > "d"')).toBe('a &amp; b &lt; c &gt; &quot;d&quot;');
  });
});
