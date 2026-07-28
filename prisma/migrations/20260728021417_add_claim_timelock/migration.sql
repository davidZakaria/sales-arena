-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "claimExpiresAt" DATETIME;
ALTER TABLE "Agency" ADD COLUMN "claimedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Agency_claimExpiresAt_idx" ON "Agency"("claimExpiresAt");
