"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishAgencyToOpenRace } from "@/lib/actions/operations";
import type { AgencyStatus } from "@/generated/prisma/client";
import { AgencyStatusBadge } from "@/components/agency/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DraftAgency = {
  id: string;
  name: string;
  location: string | null;
  repPhone1: string | null;
  status: AgencyStatus;
};

export function DraftLeadsTable({ drafts }: { drafts: DraftAgency[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePublish(agencyId: string) {
    startTransition(async () => {
      await publishAgencyToOpenRace(agencyId);
      router.refresh();
    });
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">
          No draft leads. Create a broker above to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell className="font-medium">{draft.name}</TableCell>
                <TableCell>{draft.location ?? "—"}</TableCell>
                <TableCell>{draft.repPhone1 ?? "—"}</TableCell>
                <TableCell>
                  <AgencyStatusBadge status={draft.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handlePublish(draft.id)}
                  >
                    Publish to Open Race
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
