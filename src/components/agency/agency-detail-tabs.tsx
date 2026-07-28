"use client";

import type { ContractStatus } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { ComplianceVault } from "@/components/agency/compliance-vault";
import {
  ActivityLogTimeline,
  type ActivityLogEntry,
} from "@/components/agency/activity-log-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AgencyDetailTabsProps = {
  agencyId: string;
  commercialRegister: string | null;
  taxId: string | null;
  contractStatus: ContractStatus;
  activityLogs: ActivityLogEntry[];
  permissions: AgencyPermissions;
};

export function AgencyDetailTabs({
  agencyId,
  commercialRegister,
  taxId,
  contractStatus,
  activityLogs,
  permissions,
}: AgencyDetailTabsProps) {
  return (
    <Tabs defaultValue="compliance" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="compliance">Compliance Vault</TabsTrigger>
        <TabsTrigger value="activity">Activity Log</TabsTrigger>
      </TabsList>
      <TabsContent value="compliance" className="mt-4">
        <ComplianceVault
          agencyId={agencyId}
          commercialRegister={commercialRegister}
          taxId={taxId}
          contractStatus={contractStatus}
          permissions={permissions}
        />
      </TabsContent>
      <TabsContent value="activity" className="mt-4">
        <ActivityLogTimeline logs={activityLogs} />
      </TabsContent>
    </Tabs>
  );
}
