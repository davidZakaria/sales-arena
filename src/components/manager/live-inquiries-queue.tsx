"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { assignInquiry } from "@/lib/actions/inquiry";
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

export type LiveInquiryRow = {
  id: string;
  brokerPhone: string;
  rawMessage: string;
  createdAt: Date;
  agencyName: string | null;
};

type SalesUser = { id: string; name: string; email: string };

export function LiveInquiriesQueue({
  inquiries,
  salesUsers,
}: {
  inquiries: LiveInquiryRow[];
  salesUsers: SalesUser[];
}) {
  const t = useTranslations("inquiry");
  const tTables = useTranslations("tables");

  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("queueEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("liveQueueSection")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("liveQueueHint")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("receivedAt")}</TableHead>
              <TableHead className="hidden sm:table-cell">{tTables("phone")}</TableHead>
              <TableHead>{t("requestText")}</TableHead>
              <TableHead className="hidden lg:table-cell">{tTables("agency")}</TableHead>
              <TableHead>{t("assignToRep")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <InquiryAssignRow
                key={inquiry.id}
                inquiry={inquiry}
                salesUsers={salesUsers}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InquiryAssignRow({
  inquiry,
  salesUsers,
}: {
  inquiry: LiveInquiryRow;
  salesUsers: SalesUser[];
}) {
  const router = useRouter();
  const t = useTranslations("inquiry");
  const tManager = useTranslations("manager");
  const [isPending, startTransition] = useTransition();

  function handleAssign(userId: string | null) {
    if (!userId) return;
    startTransition(async () => {
      await assignInquiry(inquiry.id, userId);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">
        {new Date(inquiry.createdAt).toLocaleString()}
      </TableCell>
      <TableCell className="hidden sm:table-cell">{inquiry.brokerPhone}</TableCell>
      <TableCell>
        <p className="max-w-md text-sm">{inquiry.rawMessage}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:hidden">{inquiry.brokerPhone}</p>
      </TableCell>
      <TableCell className="hidden lg:table-cell">{inquiry.agencyName ?? "—"}</TableCell>
      <TableCell>
        <div className="min-w-[10rem] space-y-1">
          <Label className="sr-only">{t("assignToRep")}</Label>
          <Select disabled={isPending || salesUsers.length === 0} onValueChange={handleAssign}>
            <SelectTrigger className="min-h-11 sm:h-9">
              <SelectValue placeholder={tManager("selectRep")} />
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
            <p className="text-xs text-muted-foreground">{tManager("noEligibleReps")}</p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
