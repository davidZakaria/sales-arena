"use client";

import Link from "next/link";
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

type AuditRow = {
  id: string;
  name: string;
  submittedForAuditAt: Date | null;
  primaryOwner: { name: string } | null;
};

export function AuditQueueTable({ agencies }: { agencies: AuditRow[] }) {
  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">
          No agencies pending audit. The queue updates automatically when Sales reps submit all required documents.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead>Assigned Sales Rep</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell>{agency.primaryOwner?.name ?? "Unassigned"}</TableCell>
                <TableCell>
                  {agency.submittedForAuditAt
                    ? new Date(agency.submittedForAuditAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/agency/${agency.id}?mode=audit`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Review Documents
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
