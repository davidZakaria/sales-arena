"use client";

import Link from "next/link";
import type { EOIStatus } from "@/generated/prisma/client";
import { EoiStatusBadge } from "@/components/agency/eoi-badges";
import { SubmitEoiDialog } from "@/components/agency/submit-eoi-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type EoiRow = {
  id: string;
  clientName: string;
  project: string;
  amount: number;
  paymentMethod: string;
  receiptUrl: string | null;
  status: EOIStatus;
  financeNotes: string | null;
  createdAt: Date;
  user: { name: string };
  brokerContact: { name: string; role: string | null } | null;
};

type EoiTableProps = {
  agencyId: string;
  agencyName: string;
  eois: EoiRow[];
  brokerContacts: Array<{ id: string; name: string; role: string | null }>;
  canSubmit: boolean;
  viewerRole?: string;
};

export function EoiTable({
  agencyId,
  agencyName,
  eois,
  brokerContacts,
  canSubmit,
  viewerRole,
}: EoiTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Expressions of Interest</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales submit EOIs; Finance verifies funds and converts to contract.
          </p>
        </div>
        {canSubmit && (
          <SubmitEoiDialog
            agencyId={agencyId}
            agencyName={agencyName}
            brokerContacts={brokerContacts}
          />
        )}
      </CardHeader>
      <CardContent>
        {eois.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No EOIs submitted yet.
            {canSubmit ? " Use Submit EOI to record a client reservation." : ""}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead className="hidden lg:table-cell">Submitted By</TableHead>
                <TableHead className="hidden lg:table-cell">Broker</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eois.map((eoi) => (
                <TableRow key={eoi.id}>
                  <TableCell className="font-medium">
                    {eoi.clientName}
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground sm:hidden">
                      {eoi.project}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{eoi.project}</TableCell>
                  <TableCell>{eoi.amount.toLocaleString()} EGP</TableCell>
                  <TableCell className="hidden md:table-cell">{eoi.paymentMethod}</TableCell>
                  <TableCell className="hidden lg:table-cell">{eoi.user.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {eoi.brokerContact ? (
                      <span>
                        {eoi.brokerContact.name}
                        {eoi.brokerContact.role && (
                          <span className="text-muted-foreground"> · {eoi.brokerContact.role}</span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <EoiStatusBadge status={eoi.status} />
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground xl:table-cell">
                    {eoi.financeNotes ?? (eoi.receiptUrl ? "Receipt attached" : "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!canSubmit &&
          viewerRole !== "FINANCE" &&
          viewerRole !== "OPERATIONS" &&
          eois.some((eoi) => eoi.status === "PENDING_FINANCE") && (
          <p className="mt-4 text-xs text-muted-foreground">
            Pending Finance review?{" "}
            <Link href="/finance" className="text-foreground underline">
              Contact Finance team
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
