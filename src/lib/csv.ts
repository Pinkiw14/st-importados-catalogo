/**
 * Small CSV parser (no deps). Handles commas, quotes, and newlines inside quotes.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    // ignore completely empty trailing rows
    if (row.length === 1 && row[0] === "" && rows.length === 0) return;
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      pushCell();
      i += 1;
      continue;
    }

    if (ch === "\n") {
      pushCell();
      pushRow();
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // handle CRLF
      if (text[i + 1] === "\n") {
        pushCell();
        pushRow();
        i += 2;
      } else {
        pushCell();
        pushRow();
        i += 1;
      }
      continue;
    }

    cur += ch;
    i += 1;
  }

  pushCell();
  if (row.length) pushRow();

  return rows;
}
