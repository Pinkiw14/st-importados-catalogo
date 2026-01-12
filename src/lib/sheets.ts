import { parseCSV } from "./csv";

export async function fetchSheetCSV(spreadsheetId: string, gid: string): Promise<string[][]> {
  // Works if the sheet is shared "Anyone with the link" (view).
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}
