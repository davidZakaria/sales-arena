"use client";

import { useTranslations } from "next-intl";
import type { ComplianceDocumentType } from "@/generated/prisma/client";
import { formatDocType } from "@/lib/operations/labels";
import type { AgencyTableSort } from "@/lib/operations/filter-agency-rows";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

type OperationsAgencyTableToolbarProps = {
  totalRows: number;
  filteredCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  salesRep: string;
  onSalesRepChange: (value: string) => void;
  salesRepOptions: string[];
  missingDoc: ComplianceDocumentType | "ALL";
  onMissingDocChange: (value: ComplianceDocumentType | "ALL") => void;
  sort: AgencyTableSort;
  onSortChange: (value: AgencyTableSort) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReset: () => void;
  showMissingDocFilter?: boolean;
  showSalesRepFilter?: boolean;
};

export function OperationsAgencyTableToolbar({
  totalRows,
  filteredCount,
  query,
  onQueryChange,
  salesRep,
  onSalesRepChange,
  salesRepOptions,
  missingDoc,
  onMissingDocChange,
  sort,
  onSortChange,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onReset,
  showMissingDocFilter = true,
  showSalesRepFilter = true,
}: OperationsAgencyTableToolbarProps) {
  const t = useTranslations("operations");
  const tTables = useTranslations("tables");
  const hasActiveFilters =
    query.trim().length > 0 || salesRep !== "ALL" || missingDoc !== "ALL";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("tableSearchPlaceholder")}
            className="ps-9"
          />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {t("tableShowingCount", {
            shown: filteredCount,
            total: totalRows,
          })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showSalesRepFilter && (
          <div className="space-y-1.5">
            <Label className="text-xs">{tTables("salesRep")}</Label>
            <Select
              value={salesRep}
              onValueChange={(value) => value && onSalesRepChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filterAllSalesReps")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filterAllSalesReps")}</SelectItem>
                {salesRepOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showMissingDocFilter && (
          <div className="space-y-1.5">
            <Label className="text-xs">{t("filterMissingDoc")}</Label>
            <Select
              value={missingDoc}
              onValueChange={(value) =>
                value && onMissingDocChange(value as ComplianceDocumentType | "ALL")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filterAnyMissingDoc")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filterAnyMissingDoc")}</SelectItem>
                <SelectItem value="TAX_ID">{formatDocType("TAX_ID")}</SelectItem>
                <SelectItem value="COMMERCIAL_REGISTER">
                  {formatDocType("COMMERCIAL_REGISTER")}
                </SelectItem>
                <SelectItem value="CONTRACT">{formatDocType("CONTRACT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">{t("tableSort")}</Label>
          <Select value={sort} onValueChange={(value) => value && onSortChange(value as AgencyTableSort)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">{t("sortNameAsc")}</SelectItem>
              <SelectItem value="name-desc">{t("sortNameDesc")}</SelectItem>
              <SelectItem value="salesRep-asc">{t("sortSalesRep")}</SelectItem>
              {showMissingDocFilter && (
                <SelectItem value="missing-desc">{t("sortMostMissing")}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("tablePageSize")}</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => value && onPageSizeChange(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {t("tableRowsPerPage", { count: size })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasActiveFilters && (
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            <X className="me-1 h-3.5 w-3.5" />
            {t("tableClearFilters")}
          </Button>
        )}
        <div className="ms-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t("tablePrevPage")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("tablePageOf", { page, total: pageCount })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {t("tableNextPage")}
          </Button>
        </div>
      </div>
    </div>
  );
}
