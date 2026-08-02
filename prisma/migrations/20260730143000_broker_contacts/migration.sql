-- CreateTable
CREATE TABLE "BrokerContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrokerContact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EOI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerContactId" TEXT,
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
    CONSTRAINT "EOI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EOI_brokerContactId_fkey" FOREIGN KEY ("brokerContactId") REFERENCES "BrokerContact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EOI" ("id", "agencyId", "userId", "brokerContactId", "clientName", "project", "amount", "paymentMethod", "receiptUrl", "status", "financeNotes", "createdAt", "updatedAt") SELECT "id", "agencyId", "userId", NULL, "clientName", "project", "amount", "paymentMethod", "receiptUrl", "status", "financeNotes", "createdAt", "updatedAt" FROM "EOI";
DROP TABLE "EOI";
ALTER TABLE "new_EOI" RENAME TO "EOI";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BrokerContact_agencyId_idx" ON "BrokerContact"("agencyId");
CREATE INDEX "BrokerContact_phone_idx" ON "BrokerContact"("phone");
CREATE INDEX "EOI_brokerContactId_idx" ON "EOI"("brokerContactId");
