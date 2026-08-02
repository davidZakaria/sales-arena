-- AlterTable
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
    "brokerInviteToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agency_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agency_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Agency" ("id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "primaryOwnerId", "createdById", "source", "inboundNotes", "contractStatus", "isDisputed", "claimedAt", "claimExpiresAt", "submittedForAuditAt", "brokerInviteToken", "createdAt", "updatedAt")
SELECT "id", "name", "type", "commercialRegister", "taxId", "whatsappLink", "location", "repPhone1", "status", "primaryOwnerId", "createdById", "source", "inboundNotes", "contractStatus", "isDisputed", "claimedAt", "claimExpiresAt", "submittedForAuditAt", lower(hex(randomblob(16))), "createdAt", "updatedAt" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "Agency_brokerInviteToken_key" ON "Agency"("brokerInviteToken");
