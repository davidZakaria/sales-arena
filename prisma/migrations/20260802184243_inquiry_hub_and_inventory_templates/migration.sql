-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT,
    "brokerPhone" TEXT NOT NULL,
    "rawMessage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedSalesId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_assignedSalesId_fkey" FOREIGN KEY ("assignedSalesId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_assignedSalesId_idx" ON "Inquiry"("assignedSalesId");

-- CreateIndex
CREATE INDEX "Inquiry_brokerPhone_idx" ON "Inquiry"("brokerPhone");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryTemplate_isActive_idx" ON "InventoryTemplate"("isActive");

-- CreateIndex
CREATE INDEX "InventoryTemplate_project_idx" ON "InventoryTemplate"("project");

-- CreateIndex
CREATE INDEX "InventoryTemplate_createdById_idx" ON "InventoryTemplate"("createdById");

-- CreateIndex
CREATE INDEX "Agency_status_idx" ON "Agency"("status");

-- CreateIndex
CREATE INDEX "Agency_primaryOwnerId_idx" ON "Agency"("primaryOwnerId");

-- CreateIndex
CREATE INDEX "Agency_createdById_idx" ON "Agency"("createdById");

-- CreateIndex
CREATE INDEX "Agency_source_idx" ON "Agency"("source");

-- CreateIndex
CREATE INDEX "Agency_contractStatus_idx" ON "Agency"("contractStatus");

-- CreateIndex
CREATE INDEX "Agency_claimExpiresAt_idx" ON "Agency"("claimExpiresAt");

-- CreateIndex
CREATE INDEX "Agency_isDisputed_idx" ON "Agency"("isDisputed");

-- CreateIndex
CREATE INDEX "Agency_submittedForAuditAt_idx" ON "Agency"("submittedForAuditAt");

-- CreateIndex
CREATE INDEX "Agency_whatsappLink_idx" ON "Agency"("whatsappLink");

-- CreateIndex
CREATE INDEX "Agency_repPhone1_idx" ON "Agency"("repPhone1");

-- CreateIndex
CREATE INDEX "EOI_status_idx" ON "EOI"("status");

-- CreateIndex
CREATE INDEX "EOI_agencyId_idx" ON "EOI"("agencyId");

-- CreateIndex
CREATE INDEX "EOI_userId_idx" ON "EOI"("userId");

-- CreateIndex
CREATE INDEX "EOI_createdAt_idx" ON "EOI"("createdAt");
