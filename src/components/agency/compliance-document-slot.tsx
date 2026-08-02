"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleDashed, FileText, UploadCloud } from "lucide-react";
import type { ComplianceDocumentType } from "@/generated/prisma/client";
import { uploadComplianceDocument } from "@/lib/actions/agency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ComplianceDocumentSlotData = {
  id: string;
  fileName: string;
  createdAt: Date;
  uploadedBy: { name: string };
} | null;

type ComplianceDocumentSlotProps = {
  agencyId: string;
  documentType: ComplianceDocumentType;
  titleKey: "docTaxIdTitle" | "docCommercialRegisterTitle" | "docContractTitle";
  subtitleKey: "docTaxIdHint" | "docCommercialRegisterHint" | "docContractHint";
  document: ComplianceDocumentSlotData;
  canUpload: boolean;
  onError?: (message: string) => void;
};

export function ComplianceDocumentSlot({
  agencyId,
  documentType,
  titleKey,
  subtitleKey,
  document,
  canUpload,
  onError,
}: ComplianceDocumentSlotProps) {
  const router = useRouter();
  const t = useTranslations("agency");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const uploaded = document !== null;

  function handleFileSelected() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        await uploadComplianceDocument(agencyId, documentType, file.name);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 transition-colors",
        uploaded
          ? "border-success/40 bg-success/5"
          : "border-dashed border-warning/50 bg-warning/5",
      )}
    >
      <div className="flex items-start gap-3">
        {uploaded ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
        ) : (
          <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{t(titleKey)}</p>
            <Badge
              variant="outline"
              className={uploaded ? "status-success" : "status-warning"}
            >
              {uploaded ? t("docUploaded") : t("docMissing")}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(subtitleKey)}</p>
        </div>
      </div>

      {uploaded && document && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-card/80 px-3 py-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium text-foreground">{document.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {document.uploadedBy.name} · {new Date(document.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {canUpload && (
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="sr-only"
            disabled={isPending}
            onChange={handleFileSelected}
          />
          <Button
            type="button"
            variant={uploaded ? "outline" : "default"}
            className="min-h-11 w-full"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="me-2 h-4 w-4" />
            {isPending ? t("docUploading") : uploaded ? t("docReplace") : t("docUploadFile")}
          </Button>
        </div>
      )}
    </div>
  );
}
