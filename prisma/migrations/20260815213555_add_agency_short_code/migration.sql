-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "shortCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Agency_shortCode_key" ON "Agency"("shortCode");
