"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { InventoryTemplateRow } from "@/components/inventory/inventory-template-grid";
import {
  InquiryRespondDialog,
  type SalesInquiryRow,
} from "@/components/inquiries/inquiry-respond-dialog";
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

export function InquiriesTable({
  inquiries,
  templates,
}: {
  inquiries: SalesInquiryRow[];
  templates: InventoryTemplateRow[];
}) {
  const t = useTranslations("inquiry");
  const tTables = useTranslations("tables");
  const [activeInquiry, setActiveInquiry] = useState<SalesInquiryRow | null>(null);

  if (inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("salesEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("salesSection")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("salesHint")}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("receivedAt")}</TableHead>
                <TableHead className="hidden sm:table-cell">{tTables("phone")}</TableHead>
                <TableHead>{t("requestText")}</TableHead>
                <TableHead className="text-end">{tTables("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{inquiry.brokerPhone}</TableCell>
                  <TableCell>
                    <p className="max-w-md truncate text-sm">{inquiry.rawMessage}</p>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      size="sm"
                      className="min-h-11 sm:min-h-0"
                      onClick={() => setActiveInquiry(inquiry)}
                    >
                      {t("respond")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activeInquiry && (
        <InquiryRespondDialog
          inquiry={activeInquiry}
          templates={templates}
          open={Boolean(activeInquiry)}
          onOpenChange={(open) => {
            if (!open) setActiveInquiry(null);
          }}
        />
      )}
    </>
  );
}
