export function detectDelim(line) {
  let best = ';', bestN = -1;
  [';', '\t', ','].forEach(d => {
    const n = (line.match(new RegExp(d === '\t' ? '\\t' : '\\' + d, 'g')) || []).length;
    if (n > bestN) { best = d; bestN = n; }
  });
  return best;
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delim = detectDelim(lines[0]);

  // detect if first line is a header
  const firstCells = lines[0].split(delim).map(c => c.trim().toLowerCase());
  const isHeader = firstCells.some(c => ['name', 'debitor', 'händler', 'händlername', 'adresse', 'address', 'nummer'].some(k => c.includes(k)));
  const dataLines = isHeader ? lines.slice(1) : lines;

  return dataLines.map((line, i) => {
    const cells = line.split(delim).map(c => c.replace(/^["']|["']$/g, '').trim());
    // Columns: Debitorennummer; Name; Adresse (min 2 cols, max 3)
    if (cells.length < 2) return null;
    const debitor = cells.length >= 3 ? cells[0] : '';
    const name = cells.length >= 3 ? cells[1] : cells[0];
    const address = cells.length >= 3 ? cells[2] : cells[1];
    if (!address) return null;
    const vt = cells.length >= 4 ? cells[3].trim() : '';
    const smRaw = cells.length >= 5 ? parseInt(cells[4], 10) : NaN;
    return {
      id: crypto.randomUUID(), // Add unique ID
      originalLine: i + 1,
      debitor,
      name: name || `Händler ${i + 1}`,
      address,
      visitTime: /^\d{1,2}:\d{2}$/.test(vt) ? vt : '',
      stayMin: !isNaN(smRaw) ? smRaw : null,
      lat: null,
      lon: null
    };
  }).filter(Boolean);
}
