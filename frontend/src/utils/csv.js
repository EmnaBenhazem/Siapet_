/**
 * Export CSV utility — RFC 4180 compatible, Excel-friendly (BOM UTF-8).
 *
 * @param {string} filename  Base name without extension (".csv" appended).
 * @param {Array<{key: string, label: string}>} columns  Column descriptors.
 * @param {Array<object>} rows  Data rows; each row[col.key] is the cell value.
 */
export function exportCSV(filename, columns, rows) {
  const escape = v => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n;\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = columns.map(c => escape(c.label)).join(';');
  const body = rows.map(r => columns.map(c => escape(r[c.key])).join(';')).join('\r\n');
  const bom = '﻿';
  const csv = bom + header + '\r\n' + body;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
