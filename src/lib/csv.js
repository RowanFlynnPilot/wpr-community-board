// RFC-4180-style CSV: every field quoted, inner quotes doubled, CRLF rows.
// Note bodies contain commas, quotes, and newlines — a naive join corrupts
// the file the first time someone writes a garage-sale note with a list.
export function toCsv(rows, keys = rows.length ? Object.keys(rows[0]) : []) {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [
    keys.map(quote).join(','),
    ...rows.map((row) => keys.map((key) => quote(row[key])).join(',')),
  ].join('\r\n');
}

export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
