"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AgencyStatus, ComplianceDocumentType, ContractStatus } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/agency/normalize-contact";
import { updateAgencyCompliance } from "@/lib/actions/agency";
import {
  returnAgencyForRevision,
  verifyAgencyCompliance,
} from "@/lib/actions/operations";
import { ComplianceDocumentSlot } from "@/components/agency/compliance-document-slot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ComplianceDocumentRow = {
  id: string;
  fileName: string;
  documentType: ComplianceDocumentType;
  createdAt: Date;
  uploadedBy: { name: string };
};

type ComplianceVaultProps = {
  agencyId: string;
  agencyStatus: AgencyStatus;
  commercialRegister: string | null;
  taxId: string | null;
  contractStatus: ContractStatus;
  documents: ComplianceDocumentRow[];
  permissions: AgencyPermissions;
};

const SALES_DOC_SLOTS: {
  type: ComplianceDocumentType;
  titleKey: "docTaxIdTitle" | "docCommercialRegisterTitle" | "docContractTitle";
  subtitleKey: "docTaxIdHint" | "docCommercialRegisterHint" | "docContractHint";
}[] = [
  {
    type: "TAX_ID",
    titleKey: "docTaxIdTitle",
    subtitleKey: "docTaxIdHint",
  },
  {
    type: "COMMERCIAL_REGISTER",
    titleKey: "docCommercialRegisterTitle",
    subtitleKey: "docCommercialRegisterHint",
  },
  {
    type: "CONTRACT",
    titleKey: "docContractTitle",
    subtitleKey: "docContractHint",
  },
];

function latestDocumentForType(
  documents: ComplianceDocumentRow[],
  type: ComplianceDocumentType,
) {
  const matches = documents.filter((doc) => doc.documentType === type);
  if (matches.length === 0) return null;
  return matches.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

export function ComplianceVault({
  agencyId,
  agencyStatus,
  commercialRegister,
  taxId,
  contractStatus,
  documents,
  permissions,
}: ComplianceVaultProps) {
  const router = useRouter();
  const t = useTranslations("agency");
  const [cr, setCr] = useState(commercialRegister ?? "");
  const [tax, setTax] = useState(taxId ?? "");
  const [status, setStatus] = useState<ContractStatus>(contractStatus);
  const [message, setMessage] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const uploadLocked =
    !permissions.canUploadDocuments ||
    agencyStatus === "PENDING_AUDIT" ||
    agencyStatus === "VERIFIED";

  const waitingForAudit =
    agencyStatus === "PENDING_AUDIT" && permissions.isPrimaryOwner;

  const uploadedTypes = new Set(documents.map((doc) => doc.documentType));
  const uploadedCount = REQUIRED_DOCUMENT_TYPES.filter((type) =>
    uploadedTypes.has(type),
  ).length;
  const missingTypes = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAgencyCompliance(agencyId, {
          commercialRegister: cr,
          taxId: tax,
          contractStatus: status,
        });
        setMessage(t("complianceSaved"));
        router.refresh();
      } catch {
        setMessage(t("complianceSaveFailed"));
      }
    });
  }

  function handleVerify() {
    startTransition(async () => {
      try {
        await verifyAgencyCompliance(agencyId, {
          commercialRegister: cr,
          taxId: tax,
          contractStatus: "SIGNED",
        });
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t("verifyFailed"));
      }
    });
  }

  function handleReturn() {
    startTransition(async () => {
      try {
        await returnAgencyForRevision(agencyId, returnReason.trim() || undefined);
        setReturnReason("");
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t("returnFailed"));
      }
    });
  }

  return (
    <Card
      className={cn(
        permissions.isAuditMode && "border-warning ring-1 ring-warning/30",
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{t("complianceVaultFull")}</CardTitle>
          {permissions.isAuditMode && (
            <Badge className="status-warning hover:opacity-90">{t("auditMode")}</Badge>
          )}
        </div>
        <CardDescription>{t("complianceDescription")}</CardDescription>
        {waitingForAudit && (
          <p className="text-sm font-medium text-warning">{t("waitingForAudit")}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("docUploadProgress")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("docUploadProgressHint")}
              </p>
            </div>
            <Badge variant="outline" className="status-info text-sm">
              {t("docUploadCount", { uploaded: uploadedCount, total: REQUIRED_DOCUMENT_TYPES.length })}
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${(uploadedCount / REQUIRED_DOCUMENT_TYPES.length) * 100}%`,
              }}
            />
          </div>
          {missingTypes.length > 0 ? (
            <p className="mt-3 text-sm text-warning">
              {t("docStillMissing")}{" "}
              {missingTypes
                .map((type) =>
                  type === "TAX_ID"
                    ? t("docTaxIdTitle")
                    : type === "COMMERCIAL_REGISTER"
                      ? t("docCommercialRegisterTitle")
                      : t("docContractTitle"),
                )
                .join(" · ")}
            </p>
          ) : (
            <p className="mt-3 text-sm text-success">{t("docAllUploaded")}</p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SALES_DOC_SLOTS.map((slot) => (
            <ComplianceDocumentSlot
              key={slot.type}
              agencyId={agencyId}
              documentType={slot.type}
              titleKey={slot.titleKey}
              subtitleKey={slot.subtitleKey}
              document={latestDocumentForType(documents, slot.type)}
              canUpload={!uploadLocked}
              onError={setMessage}
            />
          ))}
        </div>

        {permissions.canVerifyAgency && (
          <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="commercialRegister">{t("commercialRegisterLabel")}</Label>
              <Input
                id="commercialRegister"
                value={cr}
                onChange={(event) => setCr(event.target.value)}
                placeholder={t("enterCommercialRegister")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">{t("taxId")}</Label>
              <Input
                id="taxId"
                value={tax}
                onChange={(event) => setTax(event.target.value)}
                placeholder={t("enterTaxId")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("contractStatusLabel")}</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ContractStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectContractStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGNED">{t("contractSigned")}</SelectItem>
                  <SelectItem value="PENDING">{t("contractPending")}</SelectItem>
                  <SelectItem value="MISSING">{t("contractMissing")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {permissions.canEditComplianceFields && !permissions.canVerifyAgency && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button onClick={handleSave} disabled={isPending} className="min-h-11">
              {isPending ? t("saving") : t("saveCompliance")}
            </Button>
          </div>
        )}

        {permissions.canVerifyAgency && (
          <div className="space-y-4 border-t border-border pt-4">
            <Button
              onClick={handleVerify}
              disabled={isPending || !cr.trim() || !tax.trim()}
              className="min-h-11 bg-success text-success-foreground hover:bg-success/90"
            >
              {isPending ? t("verifying") : t("verifyComplete")}
            </Button>
            {permissions.canReturnForRevision && (
              <div className="space-y-2">
                <Label htmlFor="returnReason">{t("returnReasonLabel")}</Label>
                <Input
                  id="returnReason"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  placeholder={t("returnReasonPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={isPending}
                  onClick={handleReturn}
                >
                  {t("returnToSales")}
                </Button>
              </div>
            )}
          </div>
        )}

        {uploadLocked && permissions.isPrimaryOwner && agencyStatus === "ASSIGNED" && (
          <p className="text-center text-sm text-muted-foreground">{t("uploadReadOnlyHint")}</p>
        )}

        {message && (
          <p
            className={cn(
              "text-sm",
              message.includes("fail") || message.includes("Failed") || message.includes("فشل")
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
