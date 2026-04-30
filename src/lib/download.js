export function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename, headers, rows) {
  const escape = (value) => {
    const text = String(value ?? '');
    return text.includes(',') || text.includes('"') || text.includes('\n')
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  };

  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(row.map(escape).join(',')));
  downloadBlob(filename, lines.join('\n'), 'text/csv;charset=utf-8;');
}

export function downloadJSON(filename, data) {
  downloadBlob(filename, JSON.stringify(data, null, 2), 'application/json');
}
