import { prisma } from "@/lib/prisma";

export async function getNewInquiries() {
  return prisma.inquiry.findMany({
    where: { status: "NEW" },
    orderBy: { createdAt: "desc" },
    include: {
      agency: { select: { id: true, name: true } },
    },
  });
}

export async function countNewInquiries() {
  return prisma.inquiry.count({ where: { status: "NEW" } });
}

export async function countAssignedInquiriesForSales(salesUserId: string) {
  return prisma.inquiry.count({
    where: { status: "ASSIGNED", assignedSalesId: salesUserId },
  });
}

export async function getAssignedInquiriesForSales(salesUserId: string) {
  return prisma.inquiry.findMany({
    where: { status: "ASSIGNED", assignedSalesId: salesUserId },
    orderBy: { createdAt: "desc" },
    include: {
      agency: { select: { id: true, name: true } },
    },
  });
}

export async function getActiveInventoryTemplates() {
  return prisma.inventoryTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ project: "asc" }, { title: "asc" }],
  });
}
