import bcrypt from "bcryptjs";
import type { AgencyStatus, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PASSWORD = process.env.IMPORT_DEFAULT_PASSWORD ?? "brm123456";
const IMPORT_EMAIL_DOMAIN =
  process.env.IMPORT_EMAIL_DOMAIN ?? "newjerseyegypt.com";

const LEGACY_HEADERS = {
  name: ["name", "agency", "agency name", "broker", "broker name"],
  sales: ["sales", "primary sales", "sales rep", "primary owner"],
  shareWith: ["share with", "share with sales", "co-pilot", "co-pilots"],
  whatsapp: ["whatsapp", "whatsapp link"],
  location: ["location", "area", "city"],
  repPhone1: ["rep phone 1", "rep phone", "phone", "mobile", "phone 1"],
  taxId: ["الرقم الضريبي", "tax id", "taxid"],
  commercialRegister: ["رقم السجل التجاري", "commercial register", "cr"],
} as const;

export type LegacyImportRow = Record<string, unknown>;

export type LegacyImportBatchResult = {
  created: number;
  updated: number;
  skipped: number;
  usersCreated: number;
  usersMatched: number;
  openRaceCount: number;
  assignedCount: number;
  warnings: string[];
};

type UserCache = Map<
  string,
  { id: string; name: string; email: string; role: Role; managerId: string | null }
>;

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

export function isOpenRaceSales(value: string | null | undefined): boolean {
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
    .replace(/\s+/g, "");

  return `${slug || "user"}@${IMPORT_EMAIL_DOMAIN}`;
}

function cellText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function isErrorCell(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return value.trim().toUpperCase() === "#ERROR!";
}

function normalizeRepPhone(value: unknown): string | null {
  const text = cellText(value);
  if (!text || isErrorCell(text)) {
    return null;
  }

  const digits = text.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizeWhatsAppLink(value: unknown): string | null {
  const text = cellText(value);
  if (!text || isErrorCell(text)) {
    return null;
  }

  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }

  const digits = text.replace(/\D/g, "");
  if (!digits) {
    return text;
  }

  return `https://wa.me/${digits}`;
}

function resolveRowValue(row: LegacyImportRow, aliases: readonly string[]): string | null {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    key.trim().toLowerCase(),
    value,
  ] as const);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === alias.toLowerCase());
    if (match) {
      return cellText(match[1]);
    }
  }

  return null;
}

export function mapLegacyImportRow(row: LegacyImportRow) {
  return {
    name: resolveRowValue(row, LEGACY_HEADERS.name),
    sales: resolveRowValue(row, LEGACY_HEADERS.sales),
    shareWith: resolveRowValue(row, LEGACY_HEADERS.shareWith),
    whatsappLink: normalizeWhatsAppLink(resolveRowValue(row, LEGACY_HEADERS.whatsapp)),
    location: resolveRowValue(row, LEGACY_HEADERS.location),
    repPhone1: normalizeRepPhone(resolveRowValue(row, LEGACY_HEADERS.repPhone1)),
    taxId: resolveRowValue(row, LEGACY_HEADERS.taxId),
    commercialRegister: resolveRowValue(row, LEGACY_HEADERS.commercialRegister),
    type: resolveRowValue(row, ["type", "category", "agency type"]),
  };
}

export function buildShortCode(baselineAgencyCount: number, globalIndex: number): string {
  return `NJD-${baselineAgencyCount + globalIndex + 1000}`;
}

async function loadUserCache(): Promise<UserCache> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });

  const byNormalizedName = new Map<string, (typeof users)[number]>();
  for (const user of users) {
    byNormalizedName.set(normalizeName(user.name), user);
  }

  return byNormalizedName;
}

async function ensureUser(
  name: string,
  role: Role,
  cache: UserCache,
  stats: Pick<LegacyImportBatchResult, "usersCreated" | "usersMatched">,
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const key = normalizeName(trimmed);
  const existing = cache.get(key);
  if (existing) {
    stats.usersMatched += 1;
    return existing.id;
  }

  const baseEmail = nameToEmail(trimmed);
  let email = baseEmail;
  let suffix = 2;

  while (true) {
    const emailTaken = Array.from(cache.values()).some((user) => user.email === email);
    if (!emailTaken) {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true, managerId: true },
      });
      if (dbUser) {
        cache.set(normalizeName(dbUser.name), dbUser);
        cache.set(key, dbUser);
        stats.usersMatched += 1;
        return dbUser.id;
      }
      break;
    }

    email = `${baseEmail.split("@")[0]}.${suffix}@${IMPORT_EMAIL_DOMAIN}`;
    suffix += 1;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const created = await prisma.user.create({
    data: {
      name: trimmed,
      email,
      passwordHash,
      role,
    },
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });

  cache.set(key, created);
  stats.usersCreated += 1;
  return created.id;
}

export async function importLegacyAgenciesBatch(
  rows: LegacyImportRow[],
  options: {
    globalStartIndex: number;
    baselineAgencyCount: number;
  },
): Promise<LegacyImportBatchResult> {
  const stats: LegacyImportBatchResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    usersCreated: 0,
    usersMatched: 0,
    openRaceCount: 0,
    assignedCount: 0,
    warnings: [],
  };

  const userCache = await loadUserCache();

  for (const row of rows) {
    const mapped = mapLegacyImportRow(row);
    if (!mapped.name) {
      stats.skipped += 1;
      continue;
    }

    const salesNames = mapped.sales && !isOpenRaceSales(mapped.sales) ? [mapped.sales] : [];
    const coPilotNames = splitNames(mapped.shareWith);

    for (const salesName of salesNames) {
      await ensureUser(salesName, "SALES", userCache, stats);
    }

    for (const coPilotName of coPilotNames) {
      await ensureUser(coPilotName, "SALES", userCache, stats);
    }
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const mapped = mapLegacyImportRow(row);

    if (!mapped.name) {
      continue;
    }

    const openRace = isOpenRaceSales(mapped.sales);
    let status: AgencyStatus = openRace ? "OPEN_RACE" : "ASSIGNED";
    let primaryOwnerId: string | null = null;

    if (!openRace && mapped.sales) {
      primaryOwnerId = userCache.get(normalizeName(mapped.sales))?.id ?? null;
      if (!primaryOwnerId) {
        stats.warnings.push(
          `Agency "${mapped.name}": could not resolve primary owner "${mapped.sales}".`,
        );
        status = "OPEN_RACE";
      }
    }

    const coOwnerIds: string[] = [];
    for (const coPilotName of splitNames(mapped.shareWith)) {
      const coOwnerId = userCache.get(normalizeName(coPilotName))?.id;
      if (!coOwnerId) {
        stats.warnings.push(
          `Agency "${mapped.name}": could not resolve co-pilot "${coPilotName}".`,
        );
        continue;
      }

      if (coOwnerId !== primaryOwnerId) {
        coOwnerIds.push(coOwnerId);
      }
    }

    const globalIndex = options.globalStartIndex + index;
    const shortCode = buildShortCode(options.baselineAgencyCount, globalIndex);

    const agencyData = {
      name: mapped.name.trim(),
      shortCode,
      type: mapped.type,
      location: mapped.location,
      repPhone1: mapped.repPhone1,
      whatsappLink: mapped.whatsappLink,
      taxId: mapped.taxId,
      commercialRegister: mapped.commercialRegister,
      contractStatus: "MISSING" as const,
      status,
      primaryOwnerId: status === "OPEN_RACE" ? null : primaryOwnerId,
      claimedAt: null as Date | null,
      claimExpiresAt: null as Date | null,
      isDisputed: false,
    };

    if (status === "OPEN_RACE") {
      stats.openRaceCount += 1;
    } else {
      stats.assignedCount += 1;
    }

    const existing = await prisma.agency.findFirst({
      where: { name: agencyData.name },
      select: { id: true, shortCode: true },
    });

    if (existing) {
      await prisma.agency.update({
        where: { id: existing.id },
        data: {
          ...agencyData,
          shortCode: existing.shortCode ?? shortCode,
          coOwners: {
            set: coOwnerIds.map((id) => ({ id })),
          },
        },
      });
      stats.updated += 1;
      continue;
    }

    await prisma.agency.create({
      data: {
        ...agencyData,
        coOwners: {
          connect: coOwnerIds.map((id) => ({ id })),
        },
      },
    });
    stats.created += 1;
  }

  return stats;
}
