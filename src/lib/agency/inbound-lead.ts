import type { InboundSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { contactsMatch } from "@/lib/agency/normalize-contact";

export type DuplicateAgencyError = {
  error: "DUPLICATE";
  message: string;
  existingAgency: {
    id: string;
    name: string;
    status: string;
    primaryOwnerName: string | null;
    whatsappLink: string | null;
    repPhone1: string | null;
  };
};

export type PublicDuplicateAgencyError = {
  error: "DUPLICATE";
  message: string;
};

export async function findDuplicateAgency(
  repPhone1: string | null,
  whatsappLink: string | null,
  excludeId?: string,
) {
  const agencies = await prisma.agency.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    include: {
      primaryOwner: { select: { name: true } },
    },
  });

  return agencies.find((agency) =>
    contactsMatch(repPhone1, whatsappLink, agency.repPhone1, agency.whatsappLink),
  );
}

const SOURCE_AUDIT_LABEL: Record<InboundSource, string> = {
  OPERATIONS: "Operations",
  PUBLIC_PORTAL: "Public Portal",
  WHATSAPP: "WhatsApp Bot",
};

export async function createInboundDraftLead(data: {
  name: string;
  type?: string | null;
  location?: string | null;
  repPhone1?: string | null;
  whatsappLink?: string | null;
  source: InboundSource;
  createdById?: string | null;
  auditUserId: string;
  auditUserName: string;
  inboundNotes?: string | null;
  exposeDuplicateDetails?: boolean;
}) {
  const repPhone1 = data.repPhone1?.trim() || null;
  const whatsappLink = data.whatsappLink?.trim() || null;

  const duplicate = await findDuplicateAgency(repPhone1, whatsappLink);
  if (duplicate) {
    const payload = data.exposeDuplicateDetails
      ? ({
          error: "DUPLICATE",
          message: "This broker is already in the system.",
          existingAgency: {
            id: duplicate.id,
            name: duplicate.name,
            status: duplicate.status,
            primaryOwnerName: duplicate.primaryOwner?.name ?? null,
            whatsappLink: duplicate.whatsappLink,
            repPhone1: duplicate.repPhone1,
          },
        } satisfies DuplicateAgencyError)
      : ({
          error: "DUPLICATE",
          message:
            "This broker is already registered. Our team will contact you if needed.",
        } satisfies PublicDuplicateAgencyError);

    throw new Error(JSON.stringify(payload));
  }

  const agency = await prisma.agency.create({
    data: {
      name: data.name.trim(),
      type: data.type?.trim() || null,
      location: data.location?.trim() || null,
      repPhone1,
      whatsappLink,
      status: "DRAFT",
      source: data.source,
      inboundNotes: data.inboundNotes?.trim() || null,
      createdById: data.createdById ?? null,
      contractStatus: "MISSING",
    },
  });

  const sourceLabel = SOURCE_AUDIT_LABEL[data.source];
  await createAuditLog(
    agency.id,
    data.auditUserId,
    `Submitted via ${sourceLabel}${data.inboundNotes ? `: ${data.inboundNotes}` : ""} (${data.auditUserName})`,
  );

  return agency;
}

export async function getInboundSystemUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: "inbound@newjerseyegypt.com" },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error("Inbound system user not configured. Run db:seed.");
  }

  return user.id;
}

export async function getInboundSystemUser() {
  const user = await prisma.user.findUnique({
    where: { email: "inbound@newjerseyegypt.com" },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error("Inbound system user not configured. Run db:seed.");
  }

  return user;
}
