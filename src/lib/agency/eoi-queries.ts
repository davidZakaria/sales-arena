import { prisma } from "@/lib/prisma";
import { managerTeamAgencyFilter, userAgencyAccessFilter } from "@/lib/agency/queries";

export async function countPendingEoisForUser(userId: string) {
  return prisma.eOI.count({
    where: {
      status: "PENDING_FINANCE",
      agency: userAgencyAccessFilter(userId),
    },
  });
}

export async function getPendingEoisForUser(userId: string, limit = 5) {
  return prisma.eOI.findMany({
    where: {
      status: "PENDING_FINANCE",
      agency: userAgencyAccessFilter(userId),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      agency: { select: { id: true, name: true } },
    },
  });
}


export type BrokerEoiStatRow = {
  brokerContactId: string;
  name: string;
  role: string | null;
  agencyId: string;
  agencyName: string;
  totalEois: number;
  pendingCount: number;
  clearedCount: number;
  rejectedCount: number;
  totalAmount: number;
  pendingAmount: number;
};

export async function getBrokerEoiStatsForManager(
  viewerId: string,
  viewerRole: string,
): Promise<BrokerEoiStatRow[]> {
  const eois = await prisma.eOI.findMany({
    where: {
      agency: managerTeamAgencyFilter(viewerId, viewerRole),
      brokerContactId: { not: null },
    },
    select: {
      amount: true,
      status: true,
      brokerContactId: true,
      brokerContact: { select: { id: true, name: true, role: true } },
      agency: { select: { id: true, name: true } },
    },
  });

  const byBroker = new Map<string, BrokerEoiStatRow>();

  for (const eoi of eois) {
    if (!eoi.brokerContact || !eoi.brokerContactId) continue;

    const existing = byBroker.get(eoi.brokerContactId) ?? {
      brokerContactId: eoi.brokerContactId,
      name: eoi.brokerContact.name,
      role: eoi.brokerContact.role,
      agencyId: eoi.agency.id,
      agencyName: eoi.agency.name,
      totalEois: 0,
      pendingCount: 0,
      clearedCount: 0,
      rejectedCount: 0,
      totalAmount: 0,
      pendingAmount: 0,
    };

    existing.totalEois += 1;
    existing.totalAmount += eoi.amount;

    if (eoi.status === "PENDING_FINANCE") {
      existing.pendingCount += 1;
      existing.pendingAmount += eoi.amount;
    } else if (eoi.status === "VERIFIED" || eoi.status === "CONVERTED") {
      existing.clearedCount += 1;
    } else if (eoi.status === "REJECTED") {
      existing.rejectedCount += 1;
    }

    byBroker.set(eoi.brokerContactId, existing);
  }

  return Array.from(byBroker.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function countPendingEoisForManager(viewerId: string, viewerRole: string) {
  return prisma.eOI.count({
    where: {
      status: "PENDING_FINANCE",
      agency: managerTeamAgencyFilter(viewerId, viewerRole),
    },
  });
}

export async function getPendingEoisForManager(
  viewerId: string,
  viewerRole: string,
  limit = 5,
) {
  return prisma.eOI.findMany({
    where: {
      status: "PENDING_FINANCE",
      agency: managerTeamAgencyFilter(viewerId, viewerRole),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      agency: { select: { id: true, name: true } },
      user: { select: { name: true } },
      brokerContact: { select: { name: true, role: true } },
    },
  });
}
