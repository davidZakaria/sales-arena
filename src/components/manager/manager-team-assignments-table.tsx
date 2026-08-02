"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { AgencyStatus } from "@/generated/prisma/client";
import { AgencyStatusBadge } from "@/components/agency/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ManagerTeamAssignmentRow = {
  id: string;
  name: string;
  location: string | null;
  status: AgencyStatus;
  primaryOwnerName: string | null;
  daysOverdue: number | null;
};

export function ManagerTeamAssignmentsTable({
  agencies,
}: {
  agencies: ManagerTeamAssignmentRow[];
}) {
  const t = useTranslations("manager");
  const tTables = useTranslations("tables");
  const tCommon = useTranslations("common");

  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("teamAssignmentsEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("teamAssignmentsSection")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("teamAssignmentsHint")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTables("agency")}</TableHead>
              <TableHead className="hidden sm:table-cell">{tTables("assignedRep")}</TableHead>
              <TableHead className="hidden md:table-cell">{tCommon("status")}</TableHead>
              <TableHead className="hidden lg:table-cell">{tTables("sla")}</TableHead>
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
                  <p className="text-xs text-muted-foreground">{agency.location ?? "—"}</p>
                  <div className="mt-1 sm:hidden">
                    <p className="text-xs text-muted-foreground">
                      {agency.primaryOwnerName ?? tCommon("unassigned")}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {agency.primaryOwnerName ?? tCommon("unassigned")}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <AgencyStatusBadge status={agency.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {agency.daysOverdue !== null && agency.daysOverdue > 0 ? (
                    <span className="font-medium text-destructive">
                      {t("slaDaysOverdue", { days: agency.daysOverdue })}
                    </span>
                  ) : agency.status === "ASSIGNED" ? (
                    <span className="text-muted-foreground">{t("slaOnTrack")}</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
