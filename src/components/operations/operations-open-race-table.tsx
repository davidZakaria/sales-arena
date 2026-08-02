import Link from "next/link";
import type { OperationsOpenRaceRow } from "@/lib/operations/queries";
import { InboundSourceBadge } from "@/components/agency/inbound-source-badge";
import { TypeBadge } from "@/components/agency/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function OperationsOpenRaceTable({
  agencies,
  compact = false,
}: {
  agencies: OperationsOpenRaceRow[];
  compact?: boolean;
}) {
  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No agencies in Open Race. Publish draft leads to make them available for manager assignment.
        </CardContent>
      </Card>
    );
  }

  const rows = compact ? agencies.slice(0, 5) : agencies;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Open Race Market</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Published agencies waiting for a manager to assign a sales rep.
          </p>
        </div>
        {compact && agencies.length > 5 && (
          <Link href="/open-race" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View all ({agencies.length})
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden xl:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Published</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">
                  {agency.name}
                  <div className="mt-1 md:hidden">
                    <InboundSourceBadge source={agency.source} />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <TypeBadge type={agency.type} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <InboundSourceBadge source={agency.source} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">{agency.location ?? "—"}</TableCell>
                <TableCell className="hidden xl:table-cell">{agency.repPhone1 ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(agency.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/agency/${agency.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "min-h-11 sm:min-h-0",
                    )}
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
