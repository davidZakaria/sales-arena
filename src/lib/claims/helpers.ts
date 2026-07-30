import { CLAIM_SLA_DAYS } from "./constants";

export function addDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysRemaining(claimExpiresAt: Date, now = new Date()): number {
  const diffMs = claimExpiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getDaysOverdue(claimExpiresAt: Date, now = new Date()): number {
  const diffMs = now.getTime() - claimExpiresAt.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function buildClaimExpiry(now = new Date()): Date {
  return addDays(now, CLAIM_SLA_DAYS);
}
