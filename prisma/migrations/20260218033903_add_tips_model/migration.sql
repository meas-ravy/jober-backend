-- CreateEnum
CREATE TYPE "TipCategory" AS ENUM ('Career', 'Interview', 'Resume', 'Networking', 'WorkLife', 'Skills', 'JobSearch', 'Other');

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "TipCategory" NOT NULL DEFAULT 'Career',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tip_isPublished_idx" ON "Tip"("isPublished");

-- CreateIndex
CREATE INDEX "Tip_category_idx" ON "Tip"("category");

-- CreateIndex
CREATE INDEX "Tip_authorId_idx" ON "Tip"("authorId");

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
