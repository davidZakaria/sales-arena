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
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";
import {
  importLegacyAgenciesBatch,
  mapLegacyImportRow,
} from "../src/lib/import/legacy-agency-import";

const BATCH_SIZE = 100;

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

function parseSpreadsheet(filePath: string): Record<string, unknown>[] {
  const ext = path.extname(filePath).toLowerCase();
  let workbook: XLSX.WorkBook;

  if (ext === ".csv") {
    const csvText = fs.readFileSync(filePath, "utf8");
    workbook = XLSX.read(csvText, { type: "string" });
  } else {
    workbook = XLSX.readFile(filePath, { cellDates: false });
  }

  const sheetName =
    workbook.SheetNames.find((name) => {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[name],
        { defval: null },
      );
      if (rows.length === 0) {
        return false;
      }
      const headers = Object.keys(rows[0] ?? {}).map((header) => header.toLowerCase());
      return headers.includes("name");
    }) ?? workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Spreadsheet contains no sheets.");
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });
}

async function main() {
  const { filePath, dryRun } = parseArgs();

  console.log(`Reading ${filePath}${dryRun ? " (dry run)" : ""}…`);

  const rows = parseSpreadsheet(filePath).filter((row) => {
    const mapped = mapLegacyImportRow(row);
    return Boolean(mapped.name);
  });

  if (rows.length === 0) {
    console.error("No data rows found.");
    process.exit(1);
  }

  console.log(`Found ${rows.length} agency rows.`);

  if (dryRun) {
    const sample = mapLegacyImportRow(rows[0]!);
    console.log("Sample mapped row:", sample);
    console.log("Dry run complete — no database changes made.");
    return;
  }

  const baselineAgencyCount = await prisma.agency.count();
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let usersCreated = 0;
  let openRaceCount = 0;
  let assignedCount = 0;
  const warnings: string[] = [];

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const start = batchIndex * BATCH_SIZE;
    const batchRows = rows.slice(start, start + BATCH_SIZE);

    console.log(`Importing batch ${batchIndex + 1} of ${totalBatches}…`);

    const result = await importLegacyAgenciesBatch(batchRows, {
      globalStartIndex: start,
      baselineAgencyCount,
    });

    created += result.created;
    updated += result.updated;
    skipped += result.skipped;
    usersCreated += result.usersCreated;
    openRaceCount += result.openRaceCount;
    assignedCount += result.assignedCount;
    warnings.push(...result.warnings);
  }

  console.log("\nImport summary:");
  console.log(`  Agencies created: ${created}`);
  console.log(`  Agencies updated: ${updated}`);
  console.log(`  Rows skipped: ${skipped}`);
  console.log(`  Sales users created: ${usersCreated}`);
  console.log(`  OPEN_RACE: ${openRaceCount}`);
  console.log(`  ASSIGNED: ${assignedCount}`);

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const warning of warnings.slice(0, 20)) {
      console.log(`  - ${warning}`);
    }
    if (warnings.length > 20) {
      console.log(`  … and ${warnings.length - 20} more`);
    }
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
