export const BULK_IMPORT_COLUMN_ALIASES = {
  agencyName: [
    "Agency",
    "Agency Name",
    "Broker",
    "Broker Name",
    "Name",
    "اسم الوسيط",
    "الوسيط",
  ],
  sales: ["Sales", "Primary Sales", "Sales Rep", "Primary Owner"],
  whatsapp: ["WhatsApp", "whatsapp", "WhatsApp Link", "Whatsapp"],
  location: ["Location", "Area", "City", "المنطقة"],
  type: ["Type", "Category", "Agency Type", "Class"],
  repPhone1: ["Phone", "Rep Phone", "Mobile", "Phone 1"],
} as const;

export type NormalizedBulkImportRow = {
  name: string;
  sales: string | null;
  type: string | null;
  location: string | null;
  repPhone1: string | null;
  whatsappLink: string | null;
};

function normalizeHeader(header: string): string {
  return header.trim();
}

function cellValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function resolveColumnKey(
  headers: string[],
  aliases: readonly string[],
): string | null {
  const normalizedHeaders = new Map(
    headers.map((header) => [header.toLowerCase(), header]),
  );

  for (const alias of aliases) {
    const match = normalizedHeaders.get(alias.toLowerCase());
    if (match) return match;
  }

  return null;
}

function buildColumnMap(headers: string[]) {
  const map: Partial<Record<keyof typeof BULK_IMPORT_COLUMN_ALIASES, string | null>> = {};

  for (const key of Object.keys(BULK_IMPORT_COLUMN_ALIASES) as Array<
    keyof typeof BULK_IMPORT_COLUMN_ALIASES
  >) {
    map[key] = resolveColumnKey(headers, BULK_IMPORT_COLUMN_ALIASES[key]);
  }

  return map as Record<keyof typeof BULK_IMPORT_COLUMN_ALIASES, string | null>;
}

function getRowValue(row: Record<string, unknown>, column: string | null): string | null {
  if (!column) return null;
  return cellValue(row[column]);
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isBlankSales(value: string | null | undefined): boolean {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "open race" ||
    normalized === "(blank)" ||
    normalized === "blank" ||
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "-" ||
    normalized === "none" ||
    normalized === "unassigned"
  );
}

function normalizeWhatsApp(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  return `https://wa.me/${digits}`;
}

export function normalizeBulkImportRow(
  row: Record<string, unknown>,
  columnMap: Record<keyof typeof BULK_IMPORT_COLUMN_ALIASES, string | null>,
): NormalizedBulkImportRow | null {
  const name =
    getRowValue(row, columnMap.agencyName) ??
    cellValue(row["name"]) ??
    cellValue(row["Name"]);

  if (!name) return null;

  return {
    name,
    sales: getRowValue(row, columnMap.sales),
    type: getRowValue(row, columnMap.type),
    location: getRowValue(row, columnMap.location),
    repPhone1: getRowValue(row, columnMap.repPhone1),
    whatsappLink: normalizeWhatsApp(getRowValue(row, columnMap.whatsapp)),
  };
}

export function normalizeBulkImportRows(
  rows: Record<string, unknown>[],
): NormalizedBulkImportRow[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]).map(normalizeHeader);
  const columnMap = buildColumnMap(headers);

  const normalized: NormalizedBulkImportRow[] = [];

  for (const row of rows) {
    const parsed = normalizeBulkImportRow(row, columnMap);
    if (parsed) normalized.push(parsed);
  }

  return normalized;
}
