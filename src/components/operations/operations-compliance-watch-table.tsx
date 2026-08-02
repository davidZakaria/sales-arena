"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { OperationsComplianceWatchRow } from "@/lib/operations/queries";
import { formatDocType } from "@/lib/operations/labels";
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

export function OperationsComplianceWatchTable({
  rows,
}: {
  rows: OperationsComplianceWatchRow[];
}) {
  const t = useTranslations("operations");
  const tTables = useTranslations("tables");

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
      <CardHeader>
        <CardTitle>{t("complianceWatch")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("complianceWatchHint")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTables("agency")}</TableHead>
              <TableHead className="hidden md:table-cell">{tTables("salesRep")}</TableHead>
              <TableHead>{t("missingDocFiles")}</TableHead>
              <TableHead className="text-end">{tTables("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.location ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground md:hidden">
                    {row.primaryOwner?.name ?? t("unassigned")}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.primaryOwner?.name ?? t("unassigned")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.missingDocTypes.map((type) => (
                      <Badge key={type} variant="outline" className="status-warning">
                        {formatDocType(type)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-end">
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
