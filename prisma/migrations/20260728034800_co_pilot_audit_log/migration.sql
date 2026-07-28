-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AgencyCoOwners" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AgencyCoOwners_A_fkey" FOREIGN KEY ("A") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AgencyCoOwners_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "contractStatus" TEXT NOT NULL,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    "claimExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agency_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Agency" ("id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "primaryOwnerId", "contractStatus", "isDisputed", "claimedAt", "claimExpiresAt", "createdAt", "updatedAt") SELECT "id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "assignedSalesId", "contractStatus", false, "claimedAt", "claimExpiresAt", "createdAt", "updatedAt" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
CREATE INDEX "Agency_status_idx" ON "Agency"("status");
CREATE INDEX "Agency_primaryOwnerId_idx" ON "Agency"("primaryOwnerId");
CREATE INDEX "Agency_contractStatus_idx" ON "Agency"("contractStatus");
CREATE INDEX "Agency_claimExpiresAt_idx" ON "Agency"("claimExpiresAt");
CREATE INDEX "Agency_isDisputed_idx" ON "Agency"("isDisputed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_agencyId_idx" ON "AuditLog"("agencyId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_AgencyCoOwners_AB_unique" ON "_AgencyCoOwners"("A", "B");

-- CreateIndex
CREATE INDEX "_AgencyCoOwners_B_index" ON "_AgencyCoOwners"("B");
