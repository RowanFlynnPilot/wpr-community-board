// The weekly newsletter block: pinned picks first, then the newest, capped
// at five, with deep links into the board. Pure — the caller supplies the
// public base URL — so the escaping and ordering are testable.

const MAX_ITEMS = 5;
const TEASER_LENGTH = 90;

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function newsletterHtml(posts, baseUrl) {
  const picks = [...posts]
    .sort(
      (a, b) =>
        (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) ||
        new Date(b.published_at) - new Date(a.published_at)
    )
    .slice(0, MAX_ITEMS);

  const items = picks
    .map((p) => {
      const teaser =
        p.body.length > TEASER_LENGTH ? `${p.body.slice(0, TEASER_LENGTH).trimEnd()}…` : p.body;
      return `  <li><a href="${escapeHtml(`${baseUrl}#post-${p.id}`)}">${escapeHtml(p.title)}</a> — ${escapeHtml(teaser)}</li>`;
    })
    .join('\n');

  return [
    '<h3>This week on the Community Board</h3>',
    '<ul>',
    items,
    '</ul>',
    `<p><a href="${escapeHtml(baseUrl)}">See all the notes →</a></p>`,
  ].join('\n');
}
