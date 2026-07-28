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
          <TableHead>Primary Owner</TableHead>
          <TableHead>Disputant</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agencies.map((agency) => (
          <TableRow key={agency.id}>
            <TableCell>
              <Link
                href={`/agency/${agency.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {agency.name}
              </Link>
              <p className="text-xs text-slate-500">{agency.location}</p>
            </TableCell>
            <TableCell>{agency.primaryOwnerName ?? "—"}</TableCell>
            <TableCell>
              {agency.disputant ? (
                <div>
                  <p className="font-medium">{agency.disputant.name}</p>
                  <p className="text-xs text-slate-500">{agency.disputant.email}</p>
                </div>
              ) : (
                <span className="text-slate-400">Unknown</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
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
                  variant="outline"
                  className="text-rose-700 hover:bg-rose-50"
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
