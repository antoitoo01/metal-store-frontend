export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const BOM = '\uFEFF';
  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => {
      if (cell == null) return '';
      const str = String(cell);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')),
  ].join('\n');

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
