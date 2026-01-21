/*
  Warnings:

  - You are about to drop the column `status` on the `CompanyProfile` table. All the data in the column will be lost.
  - Made the column `location` on table `CompanyProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `CompanyProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CompanyProfile_status_idx";

-- AlterTable
ALTER TABLE "CompanyProfile" DROP COLUMN "status",
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- DropEnum
DROP TYPE "CompanyStatus";
