"use client";

import { useState, useTransition } from "react";
import type { ContractStatus } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { updateAgencyCompliance } from "@/lib/actions/agency";
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
import { UploadCloud } from "lucide-react";

type ComplianceVaultProps = {
  agencyId: string;
  commercialRegister: string | null;
  taxId: string | null;
  contractStatus: ContractStatus;
  permissions: AgencyPermissions;
};

export function ComplianceVault({
  agencyId,
  commercialRegister,
  taxId,
  contractStatus,
  permissions,
}: ComplianceVaultProps) {
  const [cr, setCr] = useState(commercialRegister ?? "");
  const [tax, setTax] = useState(taxId ?? "");
  const [status, setStatus] = useState<ContractStatus>(contractStatus);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const readOnly = !permissions.canEditCompliance;

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAgencyCompliance(agencyId, {
          commercialRegister: cr,
          taxId: tax,
          contractStatus: status,
        });
        setMessage("Compliance data saved.");
      } catch {
        setMessage("Failed to save compliance data.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal & Compliance Vault</CardTitle>
        <CardDescription>
          Track السجل التجاري, الرقم الضريبي, and contract status for this agency.
          {readOnly && (
            <span className="mt-1 block text-amber-700">
              View only — you do not have permission to edit this agency.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="commercialRegister">السجل التجاري (Commercial Register)</Label>
          <Input
            id="commercialRegister"
            value={cr}
            onChange={(event) => setCr(event.target.value)}
            placeholder="Enter commercial register number"
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">الرقم الضريبي (Tax ID)</Label>
          <Input
            id="taxId"
            value={tax}
            onChange={(event) => setTax(event.target.value)}
            placeholder="Enter tax ID"
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label>Contract Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ContractStatus)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select contract status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SIGNED">Signed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="MISSING">Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          className={`rounded-xl border border-dashed p-8 text-center ${
            permissions.canUploadDocuments
              ? "border-slate-300 bg-slate-50"
              : "border-slate-200 bg-slate-100 opacity-70"
          }`}
        >
          <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Drag & drop contract PDFs or Tax ID photos
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {permissions.canUploadDocuments
              ? "Mock upload zone — file storage coming later"
              : "Upload disabled — view-only access"}
          </p>
        </div>
        {permissions.canEditCompliance && (
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isPending} className="bg-slate-950 hover:bg-slate-800">
              {isPending ? "Saving…" : "Save Compliance Data"}
            </Button>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
