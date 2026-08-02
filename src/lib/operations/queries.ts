import { prisma } from "@/lib/prisma";
import { getDaysOverdue, getDaysRemaining } from "@/lib/claims/helpers";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/agency/normalize-contact";
import type { AgencyStatus, ComplianceDocumentType, EOIStatus, InboundSource } from "@/generated/prisma/client";

export type OperationsPipelineCounts = Record<AgencyStatus, number>;

export type OperationsDraftRow = {
  id: string;
  name: string;
  location: string | null;
  repPhone1: string | null;
  status: AgencyStatus;
  source: InboundSource;
  inboundNotes: string | null;
  createdAt: Date;
  createdBy: { name: string } | null;
};

export type OperationsAuditRow = {
  id: string;
  name: string;
  location: string | null;
  contractStatus: string;
  submittedForAuditAt: Date | null;
  daysWaiting: number;
  primaryOwner: { name: string } | null;
  documentTypes: ComplianceDocumentType[];
  missingDocTypes: ComplianceDocumentType[];
};

export type OperationsOpenRaceRow = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  source: InboundSource;
  repPhone1: string | null;
  createdAt: Date;
};

export type OperationsComplianceWatchRow = {
  id: string;
  name: string;
  location: string | null;
  primaryOwner: { name: string } | null;
  contractStatus: string;
  documentTypes: ComplianceDocumentType[];
  missingDocTypes: ComplianceDocumentType[];
  claimExpiresAt: Date | null;
  slaDaysRemaining: number | null;
  slaDaysOverdue: number | null;
};

export type OperationsActivityRow = {
  id: string;
  action: string;
  createdAt: Date;
  agency: { id: string; name: string };
  user: { name: string };
};

export type OperationsEoiCounts = Partial<Record<EOIStatus, number>>;

export type OperationsDashboardData = {
  pipeline: OperationsPipelineCounts;
  inboundSourceCounts: Partial<Record<InboundSource, number>>;
  eoiCounts: OperationsEoiCounts;
  drafts: OperationsDraftRow[];
  auditQueue: OperationsAuditRow[];
  openRace: OperationsOpenRaceRow[];
  complianceWatch: OperationsComplianceWatchRow[];
  recentActivity: OperationsActivityRow[];
};

function emptyPipeline(): OperationsPipelineCounts {
  return {
    DRAFT: 0,
    OPEN_RACE: 0,
    ASSIGNED: 0,
    PENDING_AUDIT: 0,
    VERIFIED: 0,
    ARCHIVED: 0,
  };
}

function missingDocTypes(uploaded: ComplianceDocumentType[]): ComplianceDocumentType[] {
  const set = new Set(uploaded);
  return REQUIRED_DOCUMENT_TYPES.filter((type) => !set.has(type));
}

export async function getOperationsDashboardData(): Promise<OperationsDashboardData> {
  const now = new Date();

  const [
    statusGroups,
    draftSourceGroups,
    eoiGroups,
    drafts,
    auditAgencies,
    openRace,
    assignedAgencies,
    recentActivity,
  ] = await Promise.all([
    prisma.agency.groupBy({ by: ["status"], _count: true }),
    prisma.agency.groupBy({
      by: ["source"],
      where: { status: "DRAFT" },
      _count: true,
    }),
    prisma.eOI.groupBy({ by: ["status"], _count: true }),
    prisma.agency.findMany({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        repPhone1: true,
        status: true,
        source: true,
        inboundNotes: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.agency.findMany({
      where: { status: "PENDING_AUDIT" },
      orderBy: { submittedForAuditAt: "asc" },
      include: {
        primaryOwner: { select: { name: true } },
        complianceDocuments: { select: { documentType: true } },
      },
    }),
    prisma.agency.findMany({
      where: { status: "OPEN_RACE" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        type: true,
        source: true,
        repPhone1: true,
        createdAt: true,
      },
    }),
    prisma.agency.findMany({
      where: { status: "ASSIGNED" },
      orderBy: { claimExpiresAt: "asc" },
      include: {
        primaryOwner: { select: { name: true } },
        complianceDocuments: { select: { documentType: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        agency: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const pipeline = emptyPipeline();
  for (const row of statusGroups) {
    pipeline[row.status] = row._count;
  }

  const inboundSourceCounts = Object.fromEntries(
    draftSourceGroups.map((row) => [row.source, row._count]),
  ) as Partial<Record<InboundSource, number>>;

  const eoiCounts = Object.fromEntries(
    eoiGroups.map((row) => [row.status, row._count]),
  ) as OperationsEoiCounts;

  const auditQueue: OperationsAuditRow[] = auditAgencies.map((agency) => {
    const documentTypes = Array.from(
      new Set(agency.complianceDocuments.map((doc) => doc.documentType)),
    );
    const submittedAt = agency.submittedForAuditAt;
    const daysWaiting = submittedAt
      ? Math.max(1, Math.ceil((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: agency.id,
      name: agency.name,
      location: agency.location,
      contractStatus: agency.contractStatus,
      submittedForAuditAt: submittedAt,
      daysWaiting,
      primaryOwner: agency.primaryOwner,
      documentTypes,
      missingDocTypes: missingDocTypes(documentTypes),
    };
  });

  const complianceWatch: OperationsComplianceWatchRow[] = assignedAgencies
    .map((agency) => {
      const documentTypes = Array.from(
        new Set(agency.complianceDocuments.map((doc) => doc.documentType)),
      );
      const missing = missingDocTypes(documentTypes);
      const claimExpiresAt = agency.claimExpiresAt;

      return {
        id: agency.id,
        name: agency.name,
        location: agency.location,
        primaryOwner: agency.primaryOwner,
        contractStatus: agency.contractStatus,
        documentTypes,
        missingDocTypes: missing,
        claimExpiresAt,
        slaDaysRemaining:
          claimExpiresAt && claimExpiresAt > now
            ? getDaysRemaining(claimExpiresAt, now)
            : null,
        slaDaysOverdue:
          claimExpiresAt && claimExpiresAt <= now
            ? getDaysOverdue(claimExpiresAt, now)
            : null,
      };
    })
    .filter(
      (row) =>
        row.missingDocTypes.length > 0 ||
        row.slaDaysOverdue !== null ||
        row.contractStatus === "MISSING",
    );

  return {
    pipeline,
    inboundSourceCounts,
    eoiCounts,
    drafts,
    auditQueue,
    openRace,
    complianceWatch,
    recentActivity,
  };
}
