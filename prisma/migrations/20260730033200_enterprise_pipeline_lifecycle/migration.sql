-- CreateTable
CREATE TABLE "AssignmentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssignmentRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceDocument_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
INSERT INTO "new_Agency" ("claimExpiresAt", "claimedAt", "commercialRegister", "contractStatus", "createdAt", "id", "isDisputed", "location", "name", "primaryOwnerId", "repPhone1", "status", "taxId", "type", "updatedAt", "whatsappLink") SELECT "claimExpiresAt", "claimedAt", "commercialRegister", "contractStatus", "createdAt", "id", "isDisputed", "location", "name", "primaryOwnerId", "repPhone1", "status", "taxId", "type", "updatedAt", "whatsappLink" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
CREATE INDEX "Agency_status_idx" ON "Agency"("status");
CREATE INDEX "Agency_primaryOwnerId_idx" ON "Agency"("primaryOwnerId");
CREATE INDEX "Agency_createdById_idx" ON "Agency"("createdById");
CREATE INDEX "Agency_contractStatus_idx" ON "Agency"("contractStatus");
CREATE INDEX "Agency_claimExpiresAt_idx" ON "Agency"("claimExpiresAt");
CREATE INDEX "Agency_isDisputed_idx" ON "Agency"("isDisputed");
CREATE INDEX "Agency_submittedForAuditAt_idx" ON "Agency"("submittedForAuditAt");
CREATE INDEX "Agency_whatsappLink_idx" ON "Agency"("whatsappLink");
CREATE INDEX "Agency_repPhone1_idx" ON "Agency"("repPhone1");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AssignmentRequest_status_idx" ON "AssignmentRequest"("status");
CREATE INDEX "AssignmentRequest_agencyId_idx" ON "AssignmentRequest"("agencyId");
CREATE INDEX "AssignmentRequest_userId_idx" ON "AssignmentRequest"("userId");
CREATE INDEX "AssignmentRequest_agencyId_userId_idx" ON "AssignmentRequest"("agencyId", "userId");
CREATE INDEX "ComplianceDocument_agencyId_idx" ON "ComplianceDocument"("agencyId");
CREATE INDEX "ComplianceDocument_uploadedById_idx" ON "ComplianceDocument"("uploadedById");
CREATE INDEX "ComplianceDocument_createdAt_idx" ON "ComplianceDocument"("createdAt");
