import type { ComplianceDocumentType } from "@/generated/prisma/client";

export type AgencyTableSort = "name-asc" | "name-desc" | "salesRep-asc" | "missing-desc";

export type AgencyTableFilters = {
  query: string;
  salesRep: string;
  missingDoc: ComplianceDocumentType | "ALL";
};

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

export function rowMatchesQuery(
  row: {
    name: string;
    shortCode?: string | null;
    location?: string | null;
    primaryOwner?: { name: string } | null;
  },
  query: string,
): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return true;
  }

  const haystack = [
    row.name,
    row.shortCode ?? "",
    row.location ?? "",
    row.primaryOwner?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function sortComplianceRows<
  T extends {
    name: string;
    primaryOwner?: { name: string } | null;
    missingDocTypes: ComplianceDocumentType[];
  },
>(rows: T[], sort: AgencyTableSort): T[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sort) {
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "salesRep-asc": {
        const aRep = a.primaryOwner?.name ?? "";
        const bRep = b.primaryOwner?.name ?? "";
        return aRep.localeCompare(bRep) || a.name.localeCompare(b.name);
      }
      case "missing-desc":
        return (
          b.missingDocTypes.length - a.missingDocTypes.length ||
          a.name.localeCompare(b.name)
        );
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return sorted;
}

export function filterComplianceRows<
  T extends {
    name: string;
    shortCode?: string | null;
    location?: string | null;
    primaryOwner?: { name: string } | null;
    missingDocTypes: ComplianceDocumentType[];
  },
>(rows: T[], filters: AgencyTableFilters): T[] {
  return rows.filter((row) => {
    if (!rowMatchesQuery(row, filters.query)) {
      return false;
    }

    if (filters.salesRep !== "ALL") {
      const repName = row.primaryOwner?.name ?? "";
      if (repName !== filters.salesRep) {
        return false;
      }
    }

    if (
      filters.missingDoc !== "ALL" &&
      !row.missingDocTypes.includes(filters.missingDoc)
    ) {
      return false;
    }

    return true;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

export function uniqueSalesReps(
  rows: Array<{ primaryOwner?: { name: string } | null }>,
): string[] {
  const names = new Set<string>();
  for (const row of rows) {
    if (row.primaryOwner?.name) {
      names.add(row.primaryOwner.name);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
