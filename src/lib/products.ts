import { fetchSheetCSV } from "./sheets";
import { normalizeKey, parseMoney } from "./utils";

export type CategoryKey =
  | "JBL"
  | "CELULARES"
  | "RELOJ SMART"
  | "RELOJES CASIO"
  | "APPLE"
  | "XIAOMI"
  | "VAPER"
  | "OTROS";

export type Product = {
  id: string;
  category: CategoryKey;
  name: string;
  priceList: number | null;
  priceCash: number | null;
  modelUrl?: string;
};

const SPREADSHEET_ID = "1IkY9tbrR87y_WBE6fOr-aNwsfr8f2EY5haHMTBNdrMY";

export const CATEGORY_ORDER: CategoryKey[] = [
  "JBL",
  "CELULARES",
  "RELOJ SMART",
  "RELOJES CASIO",
  "APPLE",
  "XIAOMI",
  "VAPER",
  "OTROS",
];

const GIDS: Record<CategoryKey, string> = {
  "JBL": "0",
  "CELULARES": "401435989",
  "RELOJ SMART": "71516678",
  "RELOJES CASIO": "1021956832",
  "APPLE": "81224994",
  "XIAOMI": "1451776874",
  "VAPER": "465325186",
  "OTROS": "581617004",
};

function headerIndex(header: string[]) {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    idx[normalizeKey(h)] = i;
  });
  return idx;
}

function pickCol(idx: Record<string, number>, wanted: string[]): number | null {
  for (const w of wanted) {
    const k = normalizeKey(w);
    if (k in idx) return idx[k];
  }
  return null;
}

export async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];

  for (const category of CATEGORY_ORDER) {
    const gid = GIDS[category];
    let table: string[][];
    try {
      table = await fetchSheetCSV(SPREADSHEET_ID, gid);
    } catch (e) {
      console.error(`Error: No pude leer hoja "${category}"`, e);
      continue;
    }
    if (!table.length) continue;

    const header = table[0];
    const idx = headerIndex(header);

    const colName = pickCol(idx, ["PRODUCTO", "PRODUCT", "NOMBRE"]);
const colList = pickCol(idx, [
  "PRECIO LISTA HASTA 3 SIN INTERES",
  "PRECIO DE LISTA HASTA 3 SIN INTERES",
  "PRECIO LISTA",
  "PRECIO DE LISTA",
  "LISTA",
  "PRECIO",
]);

const colCash = pickCol(idx, [
  "DESCUENTO CONTADO / TRANSFERENCIA",
  "DESCUENTO EFECTIVO / TRANSFERENCIA",
  "EFECTIVO / TRANSFERENCIA",
  "DESCUENTO EFEC TRANSFE",
  "EFECTIVO",
  "CONTADO",
  "TRANSFERENCIA",
  "DESCUENTO",
]);
    const colActive = pickCol(idx, ["ACTIVO", "ACTIVA"]);
    const colModel = pickCol(idx, ["MODELO", "LINK", "URL", "MODELO URL"]);

    for (let r = 1; r < table.length; r++) {
      const row = table[r];
      const activeVal = colActive !== null ? (row[colActive] ?? "") : "SI";
      const activeNorm = normalizeKey(activeVal);
      const active = activeNorm === "si" || activeNorm === "true" || activeNorm === "1" || activeNorm === "";
      if (!active) continue;

      const name = (colName !== null ? row[colName] : "")?.trim();
      if (!name) continue;

      const priceList = colList !== null ? parseMoney(row[colList]) : null;
      const priceCash = colCash !== null ? parseMoney(row[colCash]) : null;

      const modelUrlRaw = colModel !== null ? (row[colModel] ?? "").trim() : "";
      const modelUrl = modelUrlRaw && modelUrlRaw.startsWith("http") ? modelUrlRaw : undefined;

      all.push({
        id: `${category}:${name}`,
        category,
        name,
        priceList,
        priceCash,
        modelUrl,
      });
    }
  }

  return all;
}
