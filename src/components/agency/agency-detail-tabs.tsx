"use client";

import { useTranslations } from "next-intl";
import type { AgencyStatus, ContractStatus } from "@/generated/prisma/client";
import type { ComplianceDocumentType } from "@/generated/prisma/client";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { ComplianceVault } from "@/components/agency/compliance-vault";
import { EoiTable, type EoiRow } from "@/components/agency/eoi-table";
import {
  BrokerContactsTable,
  type BrokerContactRow,
} from "@/components/agency/broker-contacts-table";
import {
  ActivityLogTimeline,
  type ActivityLogEntry,
} from "@/components/agency/activity-log-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ComplianceDocumentRow = {
  id: string;
  fileName: string;
  documentType: ComplianceDocumentType;
  createdAt: Date;
  uploadedBy: { name: string };
};

type AgencyDetailTabsProps = {
  agencyId: string;
  agencyName: string;
  agencyStatus: AgencyStatus;
  commercialRegister: string | null;
  taxId: string | null;
  contractStatus: ContractStatus;
  documents: ComplianceDocumentRow[];
  activityLogs: ActivityLogEntry[];
  eois: EoiRow[];
  brokerContacts: BrokerContactRow[];
  brokerInviteToken?: string;
  showBrokerInviteLink?: boolean;
  permissions: AgencyPermissions;
  viewerRole?: string;
  defaultTab?: "compliance" | "broker-contacts" | "eois" | "activity";
};

export function AgencyDetailTabs({
  agencyId,
  agencyName,
  agencyStatus,
  commercialRegister,
  taxId,
  contractStatus,
  documents,
  activityLogs,
  eois,
  brokerContacts,
  brokerInviteToken,
  showBrokerInviteLink = false,
  permissions,
  viewerRole,
  defaultTab = "compliance",
}: AgencyDetailTabsProps) {
  const t = useTranslations("agency");
  const tabCount =
    2 +
    (permissions.canViewBrokerContacts ? 1 : 0) +
    (permissions.canViewEOIs ? 1 : 0);

  const gridClass =
    tabCount === 4
      ? "grid w-full grid-cols-4"
      : tabCount === 3
        ? "grid w-full grid-cols-3"
        : "grid w-full grid-cols-2";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={cn(gridClass, "h-auto w-full")}>
        <TabsTrigger value="compliance">{t("complianceVault")}</TabsTrigger>
        {permissions.canViewBrokerContacts && (
          <TabsTrigger value="broker-contacts">{t("brokerContacts")}</TabsTrigger>
        )}
        {permissions.canViewEOIs && <TabsTrigger value="eois">{t("eois")}</TabsTrigger>}
        <TabsTrigger value="activity">{t("activityLog")}</TabsTrigger>
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
      {permissions.canViewBrokerContacts && (
        <TabsContent value="broker-contacts" className="mt-4">
          <BrokerContactsTable
            agencyId={agencyId}
            agencyName={agencyName}
            contacts={brokerContacts}
            canManage={permissions.canManageBrokerContacts}
            brokerInviteToken={brokerInviteToken}
            showInviteLink={showBrokerInviteLink}
          />
        </TabsContent>
      )}
      {permissions.canViewEOIs && (
        <TabsContent value="eois" className="mt-4">
          <EoiTable
            agencyId={agencyId}
            agencyName={agencyName}
            eois={eois}
            brokerContacts={brokerContacts}
            canSubmit={permissions.canSubmitEOI}
            viewerRole={viewerRole}
          />
        </TabsContent>
      )}
      <TabsContent value="activity" className="mt-4">
        <ActivityLogTimeline logs={activityLogs} />
      </TabsContent>
    </Tabs>
  );
}
