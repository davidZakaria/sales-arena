"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OperationsOpenRaceRow } from "@/lib/operations/queries";
import {
  filterComplianceRows,
  paginateRows,
  sortComplianceRows,
  totalPages,
  type AgencyTableFilters,
  type AgencyTableSort,
} from "@/lib/operations/filter-agency-rows";
import { InboundSourceBadge } from "@/components/agency/inbound-source-badge";
import { TypeBadge } from "@/components/agency/badges";
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

function asComplianceShape(rows: OperationsOpenRaceRow[]) {
  return rows.map((row) => ({
    ...row,
    primaryOwner: null,
    missingDocTypes: [] as never[],
  }));
}

export function OperationsOpenRaceTable({
  agencies,
  compact = false,
  showToolbar = true,
}: {
  agencies: OperationsOpenRaceRow[];
  compact?: boolean;
  showToolbar?: boolean;
}) {
  const t = useTranslations("operations");
  const tTables = useTranslations("tables");
  const tCommon = useTranslations("common");

  const [filters, setFilters] = useState<Omit<AgencyTableFilters, "salesRep" | "missingDoc"> & {
    query: string;
  }>({ query: "" });
  const [sort, setSort] = useState<AgencyTableSort>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredRows = useMemo(() => {
    const shaped = asComplianceShape(agencies);
    const filtered = filterComplianceRows(shaped, {
      ...DEFAULT_FILTERS,
      query: filters.query,
    });
    const filteredIds = new Set(filtered.map((row) => row.id));
    const matched = agencies.filter((row) => filteredIds.has(row.id));
    return sortComplianceRows(
      matched.map((row) => ({ ...row, missingDocTypes: [] as never[] })),
      sort,
    );
  }, [agencies, filters.query, sort]);

  const pageCount = totalPages(filteredRows.length, compact ? 5 : pageSize);
  const visibleRows = compact
    ? filteredRows.slice(0, 5)
    : paginateRows(filteredRows, page, pageSize);

  function resetFilters() {
    setFilters({ query: "" });
    setSort("name-asc");
    setPage(1);
  }

  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("awaitingAssignmentEmpty")}
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
              {t("awaitingAssignmentTable")}
              <Badge variant="outline" className="status-info">
                {agencies.length.toLocaleString()}
              </Badge>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("awaitingAssignmentHint")}</p>
          </div>
          {compact && agencies.length > 5 && (
            <Link
              href="/manager"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
            >
              {t("viewAll", { count: agencies.length })}
            </Link>
          )}
        </div>

        {showToolbar && !compact && (
          <OperationsAgencyTableToolbar
            totalRows={agencies.length}
            filteredCount={filteredRows.length}
            query={filters.query}
            onQueryChange={(query) => {
              setFilters({ query });
              setPage(1);
            }}
            salesRep="ALL"
            onSalesRepChange={() => undefined}
            salesRepOptions={[]}
            missingDoc="ALL"
            onMissingDocChange={() => undefined}
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
            showMissingDocFilter={false}
            showSalesRepFilter={false}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">{tTables("agency")}</TableHead>
                <TableHead className="hidden sm:table-cell">{tTables("type")}</TableHead>
                <TableHead className="hidden md:table-cell">{tTables("source")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tTables("location")}</TableHead>
                <TableHead className="hidden xl:table-cell">{tTables("phone")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("sentToManager")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    {t("tableNoMatches")}
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="align-top">
                      <Link href={`/agency/${agency.id}`} className="block min-w-0 hover:underline">
                        <p className="font-medium text-foreground break-words">{agency.name}</p>
                        <AgencyShortCodeLabel
                          shortCode={agency.shortCode}
                          className="mt-0.5 block text-xs"
                        />
                      </Link>
                      <div className="mt-1 md:hidden">
                        <InboundSourceBadge source={agency.source} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top sm:table-cell">
                      <TypeBadge type={agency.type} />
                    </TableCell>
                    <TableCell className="hidden align-top md:table-cell">
                      <InboundSourceBadge source={agency.source} />
                    </TableCell>
                    <TableCell className="hidden align-top lg:table-cell">
                      {agency.location ?? "—"}
                    </TableCell>
                    <TableCell className="hidden align-top xl:table-cell">
                      {agency.repPhone1 ?? "—"}
                    </TableCell>
                    <TableCell className="hidden align-top md:table-cell">
                      {new Date(agency.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="align-top text-end">
                      <Link
                        href={`/agency/${agency.id}`}
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
      </CardContent>
    </Card>
  );
}
