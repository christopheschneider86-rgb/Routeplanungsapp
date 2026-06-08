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
  
  // check if it's the exported format
  const isExportedFormat = isHeader && firstCells.includes('ankunft') && firstCells.includes('abfahrt');

  return dataLines.map((line, i) => {
    const cells = line.split(delim).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cells.length < 2) return null;
    
    let debitor = '';
    let name = '';
    let address = '';
    let visitTime = '';
    let stayMin = null;
    let lat = null;
    let lon = null;

    if (isExportedFormat) {
      debitor = cells[0] || '';
      name = cells[1] || `Händler ${i + 1}`;
      address = cells[2] || '';
      visitTime = cells[3] || '';
      // We don't have stayMin in export, fallback to null
      lat = cells[10] ? parseFloat(cells[10]) : null;
      lon = cells[11] ? parseFloat(cells[11]) : null;
    } else {
      debitor = cells.length >= 3 ? cells[0] : '';
      name = cells.length >= 3 ? cells[1] : cells[0];
      address = cells.length >= 3 ? cells[2] : cells[1];
      const vt = cells.length >= 4 ? cells[3].trim() : '';
      visitTime = /^\d{1,2}:\d{2}$/.test(vt) ? vt : '';
      const smRaw = cells.length >= 5 ? parseInt(cells[4], 10) : NaN;
      stayMin = !isNaN(smRaw) ? smRaw : null;
    }

    if (!address) return null;

    return {
      id: crypto.randomUUID(), // Add unique ID
      originalLine: i + 1,
      debitor,
      name,
      address,
      visitTime,
      stayMin,
      lat,
      lon
    };
  }).filter(Boolean);
}
