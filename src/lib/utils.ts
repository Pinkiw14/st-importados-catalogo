export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugifyForFile(name: string) {
  // Match your file naming: spaces -> hyphens, keep alnum and hyphen
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

export function formatARS(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  try {
    return value.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${Math.round(value).toLocaleString("es-AR")}`;
  }
}

export function parseMoney(v: string | undefined | null): number | null {
  if (v === null || v === undefined) return null;

  let s = String(v)
    .trim()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/ARS/gi, "");

  // Si no hay dígitos, listo
  if (!/\d/.test(s)) return null;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  // Caso 1: tiene punto y coma -> decidir cuál es decimal por la ÚLTIMA aparición
  if (hasDot && hasComma) {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");

    // El separador que está más a la derecha suele ser el decimal
    const decimalIsComma = lastComma > lastDot;

    if (decimalIsComma) {
      // miles con punto, decimal con coma: 93.000,50
      s = s.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // miles con coma, decimal con punto: 93,000.50
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Caso 2: solo coma
    // Si parece miles (1,234 o 93,000) => sacarla
    if (/^\d{1,3}(,\d{3})+(,\d+)?$/.test(s) || /^\d{1,3}(,\d{3})+$/.test(s)) {
      s = s.replace(/,/g, "");
    } else {
      // Si parece decimal (123,45) => coma a punto
      s = s.replace(/,/g, ".");
    }
  } else if (hasDot) {
    // Caso 3: solo punto
    // Si parece miles (1.234 o 93.000) => sacarlo
    if (/^\d{1,3}(\.\d{3})+(\.\d+)?$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
    // si no, queda como decimal con punto y listo
  }

  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;

  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
