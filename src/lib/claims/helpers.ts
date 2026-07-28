import type { ContractStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CLAIM_SLA_DAYS } from "./constants";

export function addDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

export function isActiveTemporaryClaim(claimExpiresAt: Date | null): boolean {
  return claimExpiresAt !== null && claimExpiresAt > new Date();
}

export function getDaysRemaining(claimExpiresAt: Date, now = new Date()): number {
  const diffMs = claimExpiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function qualifiesForPermanentOwnership(
  taxId: string | null,
  contractStatus: ContractStatus,
): boolean {
  return Boolean(taxId) && contractStatus === "SIGNED";
}

function activeTemporaryClaimFilter(userId: string, now: Date) {
  return {
    claimExpiresAt: { gt: now },
    contractStatus: { not: "SIGNED" as const },
    OR: [
      { primaryOwnerId: userId },
      { coOwners: { some: { id: userId } } },
    ],
  };
}

export async function countActiveTemporaryClaims(userId: string): Promise<number> {
  return prisma.agency.count({
    where: activeTemporaryClaimFilter(userId, new Date()),
  });
}

export function buildClaimExpiry(now = new Date()): Date {
  return addDays(now, CLAIM_SLA_DAYS);
}
