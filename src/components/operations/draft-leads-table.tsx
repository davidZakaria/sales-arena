"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { sendLeadToManager } from "@/lib/actions/operations";
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
  const t = useTranslations("operations");
  const tTables = useTranslations("tables");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleSendToManager(agencyId: string) {
    startTransition(async () => {
      await sendLeadToManager(agencyId);
      router.refresh();
    });
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("draftLeadsEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("draftLeadsTitle")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("draftLeadsHint")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTables("agency")}</TableHead>
              <TableHead className="hidden sm:table-cell">{tTables("source")}</TableHead>
              <TableHead className="hidden md:table-cell">{tTables("location")}</TableHead>
              <TableHead className="hidden lg:table-cell">{tTables("phone")}</TableHead>
              <TableHead className="hidden md:table-cell">{tTables("created")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("intakeNotes")}</TableHead>
              <TableHead className="hidden sm:table-cell">{tCommon("status")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => {
              const canSend = Boolean(draft.name?.trim() && draft.repPhone1?.trim());
              return (
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
                        {tCommon("view")}
                      </Link>
                      <Button
                        size="sm"
                        disabled={isPending || !canSend}
                        title={!canSend ? t("sendToManagerRequiresPhone") : undefined}
                        className="min-h-11 sm:min-h-0"
                        onClick={() => handleSendToManager(draft.id)}
                      >
                        {t("sendToManager")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
