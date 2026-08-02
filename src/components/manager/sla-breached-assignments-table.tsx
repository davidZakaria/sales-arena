"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SlaBreachedRow = {
  id: string;
  name: string;
  location: string | null;
  primaryOwnerName: string | null;
  daysOverdue: number;
};

export function SlaBreachedAssignmentsTable({ agencies }: { agencies: SlaBreachedRow[] }) {
  if (agencies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No SLA breaches. Reps are uploading documents within the 14-day window.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agency</TableHead>
          <TableHead className="hidden sm:table-cell">Assigned Rep</TableHead>
          <TableHead>Days Overdue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agencies.map((agency) => (
          <TableRow key={agency.id}>
            <TableCell>
              <Link
                href={`/agency/${agency.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {agency.name}
              </Link>
              <p className="text-xs text-muted-foreground">{agency.location}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                {agency.primaryOwnerName ?? "Unassigned"}
              </p>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {agency.primaryOwnerName ?? "Unassigned"}
            </TableCell>
            <TableCell className="font-medium text-destructive">
              {agency.daysOverdue} day{agency.daysOverdue === 1 ? "" : "s"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
