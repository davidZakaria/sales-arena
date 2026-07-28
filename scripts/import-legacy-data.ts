/**
 * Legacy agency data import from Excel (.xlsx/.xls) or CSV.
 *
 * Usage:
 *   npm run import:legacy -- path/to/file.xlsx
 *   npm run import:legacy -- path/to/file.csv --dry-run
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import type { AgencyStatus, ContractStatus, Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const DEFAULT_PASSWORD = process.env.IMPORT_DEFAULT_PASSWORD ?? "brm123456";
const IMPORT_EMAIL_DOMAIN =
  process.env.IMPORT_EMAIL_DOMAIN ?? "imported.newjerseyegypt.com";

const COLUMN_ALIASES = {
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
  shareWith: ["Share With", "Share with", "Co-Pilot", "Co-Pilots", "Share With Sales"],
  salesManager: ["Sales manager", "Sales Manager", "Manager", "Sales Manager Name"],
  salesDirector: ["Sales Director", "Director", "Sales Director Name"],
  whatsapp: ["WhatsApp", "whatsapp", "WhatsApp Link", "Whatsapp"],
  taxId: ["الرقم الضريبي", "Tax ID", "Tax Id", "taxId"],
  commercialRegister: [
    "رقم السجل التجاري",
    "Commercial Register",
    "CR",
    "السجل التجاري",
  ],
  location: ["Location", "Area", "City", "المنطقة"],
  type: ["Type", "Category", "Agency Type", "Class"],
  repPhone1: ["Phone", "Rep Phone", "Mobile", "Phone 1"],
  contractStatus: ["Contract Status", "Contract", "Contract Status "],
} as const;

type ParsedRow = Record<string, string | null>;

type ImportStats = {
  usersCreated: number;
  usersMatched: number;
  agenciesCreated: number;
  agenciesUpdated: number;
  openRaceCount: number;
  assignedCount: number;
  coPilotLinks: number;
  skippedRows: number;
  warnings: string[];
};

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.find((arg) => !arg.startsWith("--"));

  if (!filePath) {
    console.error(
      "Usage: npm run import:legacy -- <path-to-file.xlsx|csv> [--dry-run]",
    );
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  return { filePath: resolved, dryRun };
}

function normalizeHeader(header: unknown): string {
  if (header === null || header === undefined) {
    return "";
  }
  return String(header).trim();
}

function cellValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function splitNames(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;،|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isOpenRaceSales(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

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

function nameToEmail(name: string): string {
  const slug = normalizeName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.-]/g, "")
    .replace(/\s+/g, ".");

  return `${slug || "user"}@${IMPORT_EMAIL_DOMAIN}`;
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
    if (match) {
      return match;
    }
  }

  return null;
}

function buildColumnMap(headers: string[]) {
  const map: Partial<Record<keyof typeof COLUMN_ALIASES, string | null>> = {};

  for (const key of Object.keys(COLUMN_ALIASES) as Array<
    keyof typeof COLUMN_ALIASES
  >) {
    map[key] = resolveColumnKey(headers, COLUMN_ALIASES[key]);
  }

  return map as Record<keyof typeof COLUMN_ALIASES, string | null>;
}

function parseSpreadsheet(filePath: string): ParsedRow[] {
  const ext = path.extname(filePath).toLowerCase();
  let workbook: XLSX.WorkBook;

  if (ext === ".csv") {
    const csvText = fs.readFileSync(filePath, "utf8");
    workbook = XLSX.read(csvText, { type: "string" });
  } else {
    workbook = XLSX.readFile(filePath, { cellDates: false });
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Spreadsheet contains no sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  return rawRows.map((row) => {
    const parsed: ParsedRow = {};

    for (const [key, value] of Object.entries(row)) {
      parsed[normalizeHeader(key)] = cellValue(value);
    }

    return parsed;
  });
}

function getRowValue(row: ParsedRow, column: string | null): string | null {
  if (!column) {
    return null;
  }

  return row[column] ?? null;
}

function normalizeWhatsApp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return trimmed;
  }

  return `https://wa.me/${digits}`;
}

function parseContractStatus(value: string | null): ContractStatus {
  if (!value) {
    return "MISSING";
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "SIGNED") {
    return "SIGNED";
  }
  if (normalized === "PENDING") {
    return "PENDING";
  }

  return "MISSING";
}

async function loadExistingUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });

  const byNormalizedName = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    byNormalizedName.set(normalizeName(user.name), user);
  }

  return { users, byNormalizedName };
}

async function ensureUser(
  name: string,
  role: Role,
  byNormalizedName: Map<
    string,
    { id: string; name: string; email: string; role: Role; managerId: string | null }
  >,
  stats: ImportStats,
  dryRun: boolean,
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const key = normalizeName(trimmed);
  const existing = byNormalizedName.get(key);
  if (existing) {
    stats.usersMatched += 1;
    return existing.id;
  }

  const email = nameToEmail(trimmed);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  if (dryRun) {
    stats.usersCreated += 1;
    const fakeId = `dry-run-${key}`;
    byNormalizedName.set(key, {
      id: fakeId,
      name: trimmed,
      email,
      role,
      managerId: null,
    });
    return fakeId;
  }

  const created = await prisma.user.create({
    data: {
      name: trimmed,
      email,
      passwordHash,
      role,
    },
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });

  byNormalizedName.set(key, created);
  stats.usersCreated += 1;
  return created.id;
}

async function main() {
  const { filePath, dryRun } = parseArgs();
  const stats: ImportStats = {
    usersCreated: 0,
    usersMatched: 0,
    agenciesCreated: 0,
    agenciesUpdated: 0,
    openRaceCount: 0,
    assignedCount: 0,
    coPilotLinks: 0,
    skippedRows: 0,
    warnings: [],
  };

  console.log(`Reading ${filePath}${dryRun ? " (dry run)" : ""}…`);

  const rows = parseSpreadsheet(filePath);
  if (rows.length === 0) {
    console.error("No data rows found.");
    process.exit(1);
  }

  const headers = Object.keys(rows[0] ?? {});
  const columns = buildColumnMap(headers);

  if (!columns.agencyName) {
    console.error(
      `Could not find an agency name column. Expected one of: ${COLUMN_ALIASES.agencyName.join(", ")}`,
    );
    console.error(`Found headers: ${headers.join(", ")}`);
    process.exit(1);
  }

  console.log("Column mapping:");
  for (const [key, value] of Object.entries(columns)) {
    console.log(`  ${key}: ${value ?? "(not found)"}`);
  }

  const { byNormalizedName } = await loadExistingUsers();

  const userNamesToCreate = new Map<string, Role>();
  const hierarchyLinks: Array<{
    salesName: string;
    managerName: string | null;
    directorName: string | null;
  }> = [];

  for (const row of rows) {
    const agencyName = getRowValue(row, columns.agencyName);
    if (!agencyName) {
      stats.skippedRows += 1;
      continue;
    }

    const sales = getRowValue(row, columns.sales);
    const shareWith = getRowValue(row, columns.shareWith);
    const manager = getRowValue(row, columns.salesManager);
    const director = getRowValue(row, columns.salesDirector);

    if (sales && !isOpenRaceSales(sales)) {
      userNamesToCreate.set(sales, "SALES");
    }

    for (const coPilotName of splitNames(shareWith)) {
      userNamesToCreate.set(coPilotName, "SALES");
    }

    if (manager) {
      userNamesToCreate.set(manager, "MANAGER");
    }

    if (director) {
      userNamesToCreate.set(director, "DIRECTOR");
    }

    if (sales && !isOpenRaceSales(sales)) {
      hierarchyLinks.push({
        salesName: sales,
        managerName: manager,
        directorName: director,
      });
    }
  }

  for (const [name, role] of Array.from(userNamesToCreate.entries())) {
    await ensureUser(name, role, byNormalizedName, stats, dryRun);
  }

  if (!dryRun) {
    for (const link of hierarchyLinks) {
      const salesUser = byNormalizedName.get(normalizeName(link.salesName));
      if (!salesUser) {
        continue;
      }

      let managerId: string | null = null;

      if (link.managerName) {
        const managerUser = byNormalizedName.get(normalizeName(link.managerName));
        if (managerUser) {
          managerId = managerUser.id;

          if (link.directorName && !managerUser.managerId) {
            const directorUser = byNormalizedName.get(
              normalizeName(link.directorName),
            );
            if (directorUser) {
              await prisma.user.update({
                where: { id: managerUser.id },
                data: { managerId: directorUser.id },
              });
            }
          }
        }
      }

      if (managerId && salesUser.managerId !== managerId) {
        await prisma.user.update({
          where: { id: salesUser.id },
          data: { managerId },
        });
      }
    }
  }

  for (const row of rows) {
    const agencyName = getRowValue(row, columns.agencyName);
    if (!agencyName) {
      continue;
    }

    const sales = getRowValue(row, columns.sales);
    const shareWith = getRowValue(row, columns.shareWith);
    const openRace = isOpenRaceSales(sales);

    let status: AgencyStatus = openRace ? "OPEN_RACE" : "ASSIGNED";
    let primaryOwnerId: string | null = null;

    if (!openRace && sales) {
      primaryOwnerId =
        byNormalizedName.get(normalizeName(sales))?.id ?? null;

      if (!primaryOwnerId) {
        stats.warnings.push(
          `Agency "${agencyName}": could not resolve primary owner "${sales}".`,
        );
        status = "OPEN_RACE";
      }
    }

    const coOwnerIds: string[] = [];
    for (const coPilotName of splitNames(shareWith)) {
      const coOwnerId = byNormalizedName.get(normalizeName(coPilotName))?.id;
      if (!coOwnerId) {
        stats.warnings.push(
          `Agency "${agencyName}": could not resolve co-pilot "${coPilotName}".`,
        );
        continue;
      }

      if (coOwnerId !== primaryOwnerId) {
        coOwnerIds.push(coOwnerId);
      }
    }

    const agencyData = {
      name: agencyName.trim(),
      type: getRowValue(row, columns.type),
      location: getRowValue(row, columns.location),
      repPhone1: getRowValue(row, columns.repPhone1),
      whatsappLink: normalizeWhatsApp(getRowValue(row, columns.whatsapp)),
      taxId: getRowValue(row, columns.taxId),
      commercialRegister: getRowValue(row, columns.commercialRegister),
      contractStatus: parseContractStatus(getRowValue(row, columns.contractStatus)),
      status,
      primaryOwnerId,
      claimedAt: null as Date | null,
      claimExpiresAt: null as Date | null,
      isDisputed: false,
    };

    if (status === "OPEN_RACE") {
      stats.openRaceCount += 1;
      agencyData.primaryOwnerId = null;
    } else {
      stats.assignedCount += 1;
    }

    stats.coPilotLinks += coOwnerIds.length;

    if (dryRun) {
      const existing = await prisma.agency.findFirst({
        where: { name: agencyData.name },
        select: { id: true },
      });
      if (existing) {
        stats.agenciesUpdated += 1;
      } else {
        stats.agenciesCreated += 1;
      }
      continue;
    }

    const existing = await prisma.agency.findFirst({
      where: { name: agencyData.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.agency.update({
        where: { id: existing.id },
        data: {
          ...agencyData,
          coOwners: {
            set: coOwnerIds.map((id) => ({ id })),
          },
        },
      });
      stats.agenciesUpdated += 1;
    } else {
      await prisma.agency.create({
        data: {
          ...agencyData,
          coOwners: {
            connect: coOwnerIds.map((id) => ({ id })),
          },
        },
      });
      stats.agenciesCreated += 1;
    }
  }

  console.log("\nImport summary:");
  console.log(`  Users created:    ${stats.usersCreated}`);
  console.log(`  Users matched:    ${stats.usersMatched}`);
  console.log(`  Agencies created: ${stats.agenciesCreated}`);
  console.log(`  Agencies updated: ${stats.agenciesUpdated}`);
  console.log(`  Assigned:         ${stats.assignedCount}`);
  console.log(`  Open Race:        ${stats.openRaceCount}`);
  console.log(`  Co-pilot links:   ${stats.coPilotLinks}`);
  console.log(`  Skipped rows:     ${stats.skippedRows}`);

  if (stats.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of stats.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (dryRun) {
    console.log("\nDry run complete — no database changes were written.");
  } else {
    console.log("\nImport complete.");
    console.log(
      `Imported users can sign in with password: ${DEFAULT_PASSWORD}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
