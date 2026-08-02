"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { publishAgencyToOpenRace } from "@/lib/actions/operations";
import type { OperationsDraftRow } from "@/lib/operations/queries";
import { AgencyStatusBadge } from "@/components/agency/badges";
import { InboundSourceBadge } from "@/components/agency/inbound-source-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DraftLeadsTable({ drafts }: { drafts: OperationsDraftRow[] }) {
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
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No draft leads. Create a broker above or wait for inbound from /join or WhatsApp.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Leads</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Review intake details, then publish to Open Race for manager assignment.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden xl:table-cell">Intake Notes</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell>
                  <Link
                    href={`/agency/${draft.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {draft.name}
                  </Link>
                  {draft.createdBy && (
                    <p className="text-xs text-muted-foreground">by {draft.createdBy.name}</p>
                  )}
                  <div className="mt-1 sm:hidden">
                    <InboundSourceBadge source={draft.source} />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <InboundSourceBadge source={draft.source} />
                </TableCell>
                <TableCell className="hidden md:table-cell">{draft.location ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{draft.repPhone1 ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(draft.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate text-sm text-muted-foreground xl:table-cell">
                  {draft.inboundNotes ?? "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <AgencyStatusBadge status={draft.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/agency/${draft.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-h-11 sm:min-h-0",
                      )}
                    >
                      View
                    </Link>
                    <Button
                      size="sm"
                      disabled={isPending}
                      className="min-h-11 sm:min-h-0"
                      onClick={() => handlePublish(draft.id)}
                    >
                      Publish
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
