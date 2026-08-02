"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { directAssignAgency } from "@/lib/actions/assignment";
import { InboundSourceBadge } from "@/components/agency/inbound-source-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ManagerLeadRow = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  source: import("@/generated/prisma/client").InboundSource;
  repPhone1: string | null;
  createdAt: Date;
};

type SalesUser = { id: string; name: string; email: string };

export function ManagerLeadAssignmentTable({
  leads,
  salesUsers,
}: {
  leads: ManagerLeadRow[];
  salesUsers: SalesUser[];
}) {
  const t = useTranslations("manager");
  const tTables = useTranslations("tables");

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("leadQueueEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("leadQueueSection")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("leadQueueHint")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTables("agency")}</TableHead>
              <TableHead className="hidden sm:table-cell">{tTables("source")}</TableHead>
              <TableHead className="hidden md:table-cell">{tTables("location")}</TableHead>
              <TableHead className="hidden lg:table-cell">{tTables("phone")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("waitingSince")}</TableHead>
              <TableHead>{t("assignToRep")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadAssignRow key={lead.id} lead={lead} salesUsers={salesUsers} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LeadAssignRow({
  lead,
  salesUsers,
}: {
  lead: ManagerLeadRow;
  salesUsers: SalesUser[];
}) {
  const router = useRouter();
  const t = useTranslations("manager");
  const tTables = useTranslations("tables");
  const [isPending, startTransition] = useTransition();

  function handleAssign(userId: string | null) {
    if (!userId) return;
    startTransition(async () => {
      await directAssignAgency(lead.id, userId);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/agency/${lead.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {lead.name}
        </Link>
        <div className="mt-1 sm:hidden">
          <InboundSourceBadge source={lead.source} />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <InboundSourceBadge source={lead.source} />
      </TableCell>
      <TableCell className="hidden md:table-cell">{lead.location ?? "—"}</TableCell>
      <TableCell className="hidden lg:table-cell">{lead.repPhone1 ?? "—"}</TableCell>
      <TableCell className="hidden md:table-cell">
        {new Date(lead.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="min-w-[10rem] space-y-1">
          <Label className="sr-only">{t("assignToRep")}</Label>
          <Select disabled={isPending || salesUsers.length === 0} onValueChange={handleAssign}>
            <SelectTrigger className="min-h-11 sm:h-9">
              <SelectValue placeholder={t("selectRep")} />
            </SelectTrigger>
            <SelectContent>
              {salesUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {salesUsers.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("noEligibleReps")}</p>
          )}
          <Link
            href={`/agency/${lead.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mt-1 hidden min-h-11 sm:inline-flex sm:min-h-0",
            )}
          >
            {tTables("view")}
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
}
