-- CreateTable
CREATE TABLE "EOI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_FINANCE',
    "financeNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EOI_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EOI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "commercialRegister" TEXT,
    "taxId" TEXT,
    "whatsappLink" TEXT,
    "location" TEXT,
    "repPhone1" TEXT,
    "status" TEXT NOT NULL,
    "primaryOwnerId" TEXT,
    "createdById" TEXT,
    "source" TEXT NOT NULL DEFAULT 'OPERATIONS',
    "inboundNotes" TEXT,
    "contractStatus" TEXT NOT NULL,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    "claimExpiresAt" DATETIME,
    "submittedForAuditAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agency_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agency_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Agency" ("id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "primaryOwnerId", "createdById", "source", "inboundNotes", "contractStatus", "isDisputed", "claimedAt", "claimExpiresAt", "submittedForAuditAt", "createdAt", "updatedAt") SELECT "id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "primaryOwnerId", "createdById", 'OPERATIONS', NULL, "contractStatus", "isDisputed", "claimedAt", "claimExpiresAt", "submittedForAuditAt", "createdAt", "updatedAt" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EOI_status_idx" ON "EOI"("status");
CREATE INDEX "EOI_agencyId_idx" ON "EOI"("agencyId");
CREATE INDEX "EOI_userId_idx" ON "EOI"("userId");
CREATE INDEX "EOI_createdAt_idx" ON "EOI"("createdAt");
CREATE INDEX "Agency_source_idx" ON "Agency"("source");
