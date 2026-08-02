"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  EoiReviewDialog,
  type FinanceEoiRow,
} from "@/components/finance/eoi-review-dialog";
import { EoiStatusBadge } from "@/components/agency/eoi-badges";
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

export function EoiClearanceTable({
  eois,
  emptyMessage = "No EOIs pending finance clearance. The queue updates when Sales reps submit new EOIs.",
}: {
  eois: FinanceEoiRow[];
  emptyMessage?: string;
}) {
  const [selected, setSelected] = useState<FinanceEoiRow | null>(null);
  const t = useTranslations("finance");
  const tTables = useTranslations("tables");
  const tCommon = useTranslations("common");

  if (eois.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("clearanceQueue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tTables("agency")}</TableHead>
                <TableHead className="hidden sm:table-cell">{tTables("client")}</TableHead>
                <TableHead className="hidden md:table-cell">{tTables("project")}</TableHead>
                <TableHead>{tTables("amount")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tTables("salesRep")}</TableHead>
                <TableHead className="hidden xl:table-cell">{tTables("broker")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tTables("submitted")}</TableHead>
                <TableHead className="hidden md:table-cell">{tCommon("status")}</TableHead>
                <TableHead className="text-end">{tTables("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eois.map((eoi) => (
                <TableRow key={eoi.id}>
                  <TableCell>
                    <Link
                      href={`/agency/${eoi.agency.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {eoi.agency.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{eoi.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{eoi.project}</TableCell>
                  <TableCell>{eoi.amount.toLocaleString()} EGP</TableCell>
                  <TableCell className="hidden lg:table-cell">{eoi.user.name}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {eoi.brokerContact?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {new Date(eoi.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <EoiStatusBadge status={eoi.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(eoi)}
                    >
                      {tCommon("review")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <EoiReviewDialog
          eoi={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
}
