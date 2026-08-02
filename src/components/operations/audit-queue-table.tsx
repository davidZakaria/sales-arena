"use client";

import Link from "next/link";
import type { OperationsAuditRow } from "@/lib/operations/queries";
import { formatDocType } from "@/lib/operations/labels";
import { ContractStatusBadge } from "@/components/agency/badges";
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

export function AuditQueueTable({
  agencies,
  compact = false,
}: {
  agencies: OperationsAuditRow[];
  compact?: boolean;
}) {
  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No agencies pending audit. The queue updates when Sales reps upload all required documents.
        </CardContent>
      </Card>
    );
  }

  const rows = compact ? agencies.slice(0, 5) : agencies;

  return (
    <Card className={compact ? undefined : "metric-warning border"}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Audit Queue</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Review compliance vault submissions and verify or return to Sales.
          </p>
        </div>
        {compact && agencies.length > 5 && (
          <span className="text-xs text-muted-foreground">
            +{agencies.length - 5} more in Audit tab
          </span>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead className="hidden md:table-cell">Sales Rep</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead className="hidden sm:table-cell">Waiting</TableHead>
              <TableHead className="hidden lg:table-cell">Documents</TableHead>
              <TableHead className="hidden lg:table-cell">Contract</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{agency.name}</p>
                  <p className="text-xs text-muted-foreground">{agency.location ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground md:hidden">
                    {agency.primaryOwner?.name ?? "Unassigned"}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {agency.primaryOwner?.name ?? "Unassigned"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {agency.submittedForAuditAt
                    ? new Date(agency.submittedForAuditAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {agency.daysWaiting > 0 ? (
                    <span
                      className={cn(
                        agency.daysWaiting >= 3 && "font-medium text-warning",
                      )}
                    >
                      {agency.daysWaiting}d
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {agency.documentTypes.map((type) => (
                      <Badge key={type} variant="outline" className="status-success">
                        {formatDocType(type)}
                      </Badge>
                    ))}
                    {agency.missingDocTypes.map((type) => (
                      <Badge
                        key={`missing-${type}`}
                        variant="outline"
                        className="status-danger"
                      >
                        Missing {formatDocType(type)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ContractStatusBadge
                    status={agency.contractStatus as "MISSING" | "PENDING" | "SIGNED"}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/agency/${agency.id}?mode=audit`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "min-h-11 bg-warning text-warning-foreground hover:bg-warning/90 sm:min-h-0",
                    )}
                  >
                    Review
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
