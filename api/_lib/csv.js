'use strict';

function csvCell(value) {
  if (value == null) return '';
  let text = String(value);
  // Neutralize spreadsheet formulas while preserving the visible value.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

function toCsv(headers, rows) {
  return [
    headers.map((header) => csvCell(header.label)).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header.key])).join(','))
  ].join('\r\n');
}

module.exports = { csvCell, toCsv };
