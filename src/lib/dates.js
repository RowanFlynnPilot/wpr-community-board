// The stamp date: 'JUN 9', from a timestamptz.
export function formatStamp(iso) {
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

// The event date: 'Thu, Jun 18', from a Postgres date ('YYYY-MM-DD').
// Parsed as a local date — new Date('YYYY-MM-DD') would read UTC midnight
// and show the previous day for everyone west of Greenwich. The locale
// follows the board language (see DATE_LOCALES in i18n.js).
export function formatEventDate(dateStr, locale = 'en-US') {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
