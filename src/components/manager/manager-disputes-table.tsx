"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  rejectDispute,
  resolveDisputeAddCoPilot,
  transferOwnership,
} from "@/lib/actions/manager";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DisputedAgencyRow = {
  id: string;
  name: string;
  location: string | null;
  primaryOwnerName: string | null;
  disputant: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export function ManagerDisputesTable({ agencies }: { agencies: DisputedAgencyRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agency</TableHead>
          <TableHead className="hidden sm:table-cell">Primary Owner</TableHead>
          <TableHead className="hidden md:table-cell">Disputant</TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
                Owner: {agency.primaryOwnerName ?? "—"}
              </p>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {agency.primaryOwnerName ?? "—"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {agency.disputant ? (
                <div>
                  <p className="font-medium">{agency.disputant.name}</p>
                  <p className="text-xs text-muted-foreground">{agency.disputant.email}</p>
                </div>
              ) : (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 sm:min-h-0"
                  disabled={isPending || !agency.disputant}
                  onClick={() =>
                    runAction(() =>
                      resolveDisputeAddCoPilot(agency.id, agency.disputant!.id),
                    )
                  }
                >
                  Add as Co-Pilot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 sm:min-h-0"
                  disabled={isPending || !agency.disputant}
                  onClick={() =>
                    runAction(() =>
                      transferOwnership(agency.id, agency.disputant!.id),
                    )
                  }
                >
                  Transfer Ownership
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="min-h-11 sm:min-h-0"
                  disabled={isPending}
                  onClick={() => runAction(() => rejectDispute(agency.id))}
                >
                  Reject Dispute
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
