-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS     "icon" TEXT;

-- AlterTable
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Site_isPinned_idx" ON "Site"("isPinned");
