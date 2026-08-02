"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AgencyStatus, ComplianceDocumentType, ContractStatus } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { updateAgencyCompliance, uploadComplianceDocument } from "@/lib/actions/agency";
import {
  returnAgencyForRevision,
  verifyAgencyCompliance,
} from "@/lib/actions/operations";
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
import { FileText, UploadCloud } from "lucide-react";
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

const DOCUMENT_TYPE_LABELS: Record<ComplianceDocumentType, string> = {
  CONTRACT: "Contract",
  TAX_ID: "Tax ID",
  COMMERCIAL_REGISTER: "Commercial Register",
  OTHER: "Other",
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cr, setCr] = useState(commercialRegister ?? "");
  const [tax, setTax] = useState(taxId ?? "");
  const [status, setStatus] = useState<ContractStatus>(contractStatus);
  const [documentType, setDocumentType] = useState<ComplianceDocumentType>("TAX_ID");
  const [message, setMessage] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const fieldsLocked =
    !permissions.canEditComplianceFields ||
    (permissions.isPrimaryOwner && agencyStatus === "ASSIGNED");

  const uploadLocked =
    !permissions.canUploadDocuments ||
    agencyStatus === "PENDING_AUDIT" ||
    agencyStatus === "VERIFIED";

  const waitingForAudit =
    agencyStatus === "PENDING_AUDIT" && permissions.isPrimaryOwner;

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAgencyCompliance(agencyId, {
          commercialRegister: cr,
          taxId: tax,
          contractStatus: status,
        });
        setMessage("Compliance data saved.");
        router.refresh();
      } catch {
        setMessage("Failed to save compliance data.");
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
        setMessage(err instanceof Error ? err.message : "Verification failed.");
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
        setMessage(err instanceof Error ? err.message : "Return failed.");
      }
    });
  }

  function handleMockUpload() {
    const fileName = fileInputRef.current?.files?.[0]?.name ?? `${documentType.toLowerCase()}-upload.pdf`;
    startTransition(async () => {
      try {
        await uploadComplianceDocument(agencyId, documentType, fileName);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Upload failed.");
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
          <CardTitle>Legal & Compliance Vault</CardTitle>
          {permissions.isAuditMode && (
            <Badge className="status-warning hover:opacity-90">Audit Mode</Badge>
          )}
          {fieldsLocked && permissions.isPrimaryOwner && agencyStatus === "ASSIGNED" && (
            <Badge variant="outline" className="status-neutral">
              Locked for Ops Audit
            </Badge>
          )}
        </div>
        <CardDescription>
          Track السجل التجاري, الرقم الضريبي, and contract status for this agency.
          {waitingForAudit && (
            <span className="mt-1 block font-medium text-warning">
              Documents submitted. Waiting for Operations Audit.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <ul className="divide-y divide-border rounded-lg border border-border bg-muted/50">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]} · {doc.uploadedBy.name} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="commercialRegister">السجل التجاري (Commercial Register)</Label>
            <Input
              id="commercialRegister"
              value={cr}
              onChange={(event) => setCr(event.target.value)}
              placeholder="Enter commercial register number"
              disabled={fieldsLocked}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">الرقم الضريبي (Tax ID)</Label>
            <Input
              id="taxId"
              value={tax}
              onChange={(event) => setTax(event.target.value)}
              placeholder="Enter tax ID"
              disabled={fieldsLocked}
            />
          </div>
          <div className="space-y-2">
            <Label>Contract Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ContractStatus)}
              disabled={fieldsLocked || permissions.canVerifyAgency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIGNED">Contract Signed</SelectItem>
                <SelectItem value="PENDING">Contract Pending</SelectItem>
                <SelectItem value="MISSING">Contract Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!uploadLocked && (
          <div className="rounded-xl border border-dashed border-border bg-muted/50 p-6">
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-center text-sm font-medium text-foreground">
              Upload contract PDFs or Tax ID photos
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Mock upload — metadata only until file storage is wired
            </p>
            <div className="mx-auto mt-4 flex max-w-md flex-col gap-3 sm:flex-row">
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as ComplianceDocumentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TAX_ID">Tax ID</SelectItem>
                  <SelectItem value="COMMERCIAL_REGISTER">Commercial Register</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input ref={fileInputRef} type="file" className="min-h-11 flex-1" />
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={isPending}
                onClick={handleMockUpload}
              >
                Upload
              </Button>
            </div>
          </div>
        )}

        {uploadLocked && permissions.isPrimaryOwner && agencyStatus === "ASSIGNED" && (
          <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center opacity-70">
            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Upload zone locked</p>
          </div>
        )}

        {permissions.canEditComplianceFields && !permissions.canVerifyAgency && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={isPending} className="min-h-11">
              {isPending ? "Saving…" : "Save Compliance Data"}
            </Button>
            {message && <p className="text-sm text-success">{message}</p>}
          </div>
        )}

        {permissions.canVerifyAgency && (
          <div className="space-y-4 border-t pt-4">
            <Button
              onClick={handleVerify}
              disabled={isPending || !cr.trim() || !tax.trim()}
              className="min-h-11 bg-success text-success-foreground hover:bg-success/90"
            >
              {isPending ? "Verifying…" : "Verify & Complete"}
            </Button>
            {permissions.canReturnForRevision && (
              <div className="space-y-2">
                <Label htmlFor="returnReason">Return reason (optional)</Label>
                <Input
                  id="returnReason"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  placeholder="e.g. Tax ID photo is blurry"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={isPending}
                  onClick={handleReturn}
                >
                  Return to Sales
                </Button>
              </div>
            )}
            {message && <p className="text-sm text-destructive">{message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
