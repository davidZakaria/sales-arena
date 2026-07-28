import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function createAuditLog(
  agencyId: string,
  userId: string,
  action: string,
  db: DbClient = prisma,
) {
  await db.auditLog.create({
    data: {
      agencyId,
      userId,
      action,
    },
  });
}

export async function createAuditLogs(
  agencyId: string,
  userId: string,
  actions: string[],
  db: DbClient = prisma,
) {
  if (actions.length === 0) {
    return;
  }

  await db.auditLog.createMany({
    data: actions.map((action) => ({
      agencyId,
      userId,
      action,
    })),
  });
}
