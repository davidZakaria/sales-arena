"use client";

import type { AgencyStatus, ContractStatus } from "@/generated/prisma/client";
import type { ComplianceDocumentType } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { ComplianceVault } from "@/components/agency/compliance-vault";
import {
  ActivityLogTimeline,
  type ActivityLogEntry,
} from "@/components/agency/activity-log-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ComplianceDocumentRow = {
  id: string;
  fileName: string;
  documentType: ComplianceDocumentType;
  createdAt: Date;
  uploadedBy: { name: string };
};

type AgencyDetailTabsProps = {
  agencyId: string;
  agencyStatus: AgencyStatus;
  commercialRegister: string | null;
  taxId: string | null;
  contractStatus: ContractStatus;
  documents: ComplianceDocumentRow[];
  activityLogs: ActivityLogEntry[];
  permissions: AgencyPermissions;
  defaultTab?: "compliance" | "activity";
};

export function AgencyDetailTabs({
  agencyId,
  agencyStatus,
  commercialRegister,
  taxId,
  contractStatus,
  documents,
  activityLogs,
  permissions,
  defaultTab = "compliance",
}: AgencyDetailTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="compliance">Compliance Vault</TabsTrigger>
        <TabsTrigger value="activity">Activity Log</TabsTrigger>
      </TabsList>
      <TabsContent value="compliance" className="mt-4">
        <ComplianceVault
          agencyId={agencyId}
          agencyStatus={agencyStatus}
          commercialRegister={commercialRegister}
          taxId={taxId}
          contractStatus={contractStatus}
          documents={documents}
          permissions={permissions}
        />
      </TabsContent>
      <TabsContent value="activity" className="mt-4">
        <ActivityLogTimeline logs={activityLogs} />
      </TabsContent>
    </Tabs>
  );
}
