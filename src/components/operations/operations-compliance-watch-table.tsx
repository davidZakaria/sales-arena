"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { OperationsComplianceWatchRow } from "@/lib/operations/queries";
import {
  filterComplianceRows,
  paginateRows,
  sortComplianceRows,
  totalPages,
  uniqueSalesReps,
  type AgencyTableFilters,
  type AgencyTableSort,
} from "@/lib/operations/filter-agency-rows";
import { formatDocType } from "@/lib/operations/labels";
import { AgencyShortCodeLabel } from "@/components/agency/agency-short-code";
import { OperationsAgencyTableToolbar } from "@/components/operations/operations-agency-table-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 50;

const DEFAULT_FILTERS: AgencyTableFilters = {
  query: "",
  salesRep: "ALL",
  missingDoc: "ALL",
};

export function OperationsComplianceWatchTable({
  rows,
  compact = false,
  showToolbar = true,
}: {
  rows: OperationsComplianceWatchRow[];
  compact?: boolean;
  showToolbar?: boolean;
}) {
  const t = useTranslations("operations");
  const tTables = useTranslations("tables");

  const [filters, setFilters] = useState<AgencyTableFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<AgencyTableSort>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const salesRepOptions = useMemo(() => uniqueSalesReps(rows), [rows]);

  const filteredRows = useMemo(() => {
    const filtered = filterComplianceRows(rows, filters);
    return sortComplianceRows(filtered, sort);
  }, [rows, filters, sort]);

  const pageCount = totalPages(filteredRows.length, compact ? 8 : pageSize);
  const visibleRows = compact
    ? filteredRows.slice(0, 8)
    : paginateRows(filteredRows, page, pageSize);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSort("name-asc");
    setPage(1);
  }

  function updateFilters(partial: Partial<AgencyTableFilters>) {
    setFilters((current) => ({ ...current, ...partial }));
    setPage(1);
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("complianceWatchEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t("complianceWatch")}
              <Badge variant="outline" className="status-warning">
                {rows.length.toLocaleString()}
              </Badge>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("complianceWatchHint")}</p>
          </div>
          {compact && rows.length > 8 && (
            <Badge variant="secondary" className="w-fit">
              {t("complianceWatchCompactHint", { count: rows.length })}
            </Badge>
          )}
        </div>

        {showToolbar && !compact && (
          <OperationsAgencyTableToolbar
            totalRows={rows.length}
            filteredCount={filteredRows.length}
            query={filters.query}
            onQueryChange={(query) => updateFilters({ query })}
            salesRep={filters.salesRep}
            onSalesRepChange={(salesRep) => updateFilters({ salesRep })}
            salesRepOptions={salesRepOptions}
            missingDoc={filters.missingDoc}
            onMissingDocChange={(missingDoc) => updateFilters({ missingDoc })}
            sort={sort}
            onSortChange={setSort}
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onReset={resetFilters}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">{tTables("agency")}</TableHead>
                <TableHead className="hidden min-w-[140px] md:table-cell">
                  {tTables("salesRep")}
                </TableHead>
                <TableHead className="min-w-[180px]">{t("missingDocFiles")}</TableHead>
                <TableHead className="hidden min-w-[120px] lg:table-cell">
                  {tTables("location")}
                </TableHead>
                <TableHead className="text-end">{tTables("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    {t("tableNoMatches")}
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top">
                      <Link
                        href={`/agency/${row.id}`}
                        className="block min-w-0 hover:underline"
                      >
                        <p className="font-medium text-foreground break-words">
                          {row.name || t("unnamedAgency")}
                        </p>
                        <AgencyShortCodeLabel
                          shortCode={row.shortCode}
                          className="mt-0.5 block text-xs"
                        />
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground md:hidden">
                        {row.primaryOwner?.name ?? t("unassigned")}
                      </p>
                    </TableCell>
                    <TableCell className="hidden align-top md:table-cell">
                      {row.primaryOwner?.name ?? t("unassigned")}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.missingDocTypes.map((type) => (
                          <Badge key={type} variant="outline" className="status-warning">
                            {formatDocType(type)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top text-sm text-muted-foreground lg:table-cell">
                      {row.location ?? "—"}
                    </TableCell>
                    <TableCell className="align-top text-end">
                      <Link
                        href={`/agency/${row.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "min-h-11 sm:min-h-0",
                        )}
                      >
                        {tTables("view")}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {compact && !showToolbar && rows.length > 8 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("complianceWatchOpenTab")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
