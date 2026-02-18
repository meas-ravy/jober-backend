-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Job_isRecommended_idx" ON "Job"("isRecommended");
