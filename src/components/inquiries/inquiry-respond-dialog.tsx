"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { markInquiryResponded } from "@/lib/actions/inquiry";
import { buildWhatsAppUrl } from "@/lib/agency/normalize-contact";
import type { InventoryTemplateRow } from "@/components/inventory/inventory-template-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export type SalesInquiryRow = {
  id: string;
  brokerPhone: string;
  rawMessage: string;
  createdAt: Date;
  agencyName: string | null;
};

export function InquiryRespondDialog({
  inquiry,
  templates,
  open,
  onOpenChange,
}: {
  inquiry: SalesInquiryRow;
  templates: InventoryTemplateRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("inquiry");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function selectTemplate(messageBody: string) {
    setBody(messageBody);
  }

  function handleLaunchWhatsApp() {
    const url = buildWhatsAppUrl(inquiry.brokerPhone, body);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleMarkResponded() {
    startTransition(async () => {
      await markInquiryResponded(inquiry.id);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("respondTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("brokerRequest")}
            </p>
            <p className="text-sm">{inquiry.rawMessage}</p>
            <p className="text-xs text-muted-foreground">
              {inquiry.brokerPhone} · {new Date(inquiry.createdAt).toLocaleString()}
            </p>
            {inquiry.agencyName && (
              <p className="text-xs text-muted-foreground">
                {t("linkedAgency")}: {inquiry.agencyName}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("pickTemplate")}
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="w-full rounded-md border p-2 text-start text-sm hover:bg-muted/50"
                  onClick={() => selectTemplate(template.messageBody)}
                >
                  <span className="font-medium">{template.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{template.project}</span>
                  {template.mediaUrl && (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      PDF
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={t("responsePlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("whatsappMediaHint")}</p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={!body.trim()}
            onClick={handleLaunchWhatsApp}
          >
            <ExternalLink className="h-4 w-4" />
            {t("launchWhatsApp")}
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={isPending}
            onClick={handleMarkResponded}
          >
            {isPending ? t("saving") : t("markResponded")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
