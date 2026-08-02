import Link from "next/link";
import type { OperationsComplianceWatchRow } from "@/lib/operations/queries";
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

export function OperationsComplianceWatchTable({
  rows,
}: {
  rows: OperationsComplianceWatchRow[];
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          All assigned agencies have complete document sets and are within SLA. Nothing needs attention here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned — Needs Attention</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Sales-owned agencies with missing compliance docs, overdue SLA, or unsigned contract status.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead className="hidden md:table-cell">Sales Rep</TableHead>
              <TableHead className="hidden sm:table-cell">Missing Docs</TableHead>
              <TableHead className="hidden lg:table-cell">Contract</TableHead>
              <TableHead className="hidden sm:table-cell">SLA</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.location ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground md:hidden">
                    {row.primaryOwner?.name ?? "Unassigned"}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.primaryOwner?.name ?? "Unassigned"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {row.missingDocTypes.length === 0 ? (
                    <span className="text-success">Complete</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.missingDocTypes.map((type) => (
                        <Badge key={type} variant="outline" className="status-warning">
                          {formatDocType(type)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ContractStatusBadge status={row.contractStatus as "MISSING" | "PENDING" | "SIGNED"} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {row.slaDaysOverdue !== null ? (
                    <span className="font-medium text-destructive">
                      {row.slaDaysOverdue}d overdue
                    </span>
                  ) : row.slaDaysRemaining !== null ? (
                    <span className="text-foreground">{row.slaDaysRemaining}d left</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-end">
                  <Link
                    href={`/agency/${row.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 sm:min-h-0")}
                  >
                    View
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
