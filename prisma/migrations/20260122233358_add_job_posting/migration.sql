-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Engineering', 'Design', 'CustomerService', 'HumanResources', 'Operations', 'Legal', 'Construction', 'Retail', 'Hospitality', 'Manufacturing', 'Transportation', 'RealEstate', 'Media', 'Other');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FullTime', 'PartTime', 'Contract', 'Internship', 'Freelance');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('Entry', 'Mid', 'Senior', 'Lead', 'Executive');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('OnSite', 'Remote', 'Hybrid');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('Range', 'Fixed', 'Negotiable');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('Hour', 'Day', 'Week', 'Month', 'Year');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('Draft', 'Pending', 'Rejected', 'Active', 'Paused', 'Closed', 'Filled');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" "JobCategory" NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "workArrangement" "WorkArrangement" NOT NULL DEFAULT 'OnSite',
    "salaryType" "SalaryType" NOT NULL DEFAULT 'Range',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryFixed" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "salaryPeriod" "SalaryPeriod" NOT NULL DEFAULT 'Year',
    "requirements" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL,
    "benefits" TEXT,
    "skills" TEXT,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "positionsAvailable" INTEGER NOT NULL DEFAULT 1,
    "status" "JobStatus" NOT NULL DEFAULT 'Draft',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_recruiterId_idx" ON "Job"("recruiterId");

-- CreateIndex
CREATE INDEX "Job_companyProfileId_idx" ON "Job"("companyProfileId");

-- CreateIndex
CREATE INDEX "Job_status_publishedAt_idx" ON "Job"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Job_category_idx" ON "Job"("category");

-- CreateIndex
CREATE INDEX "Job_employmentType_idx" ON "Job"("employmentType");

-- CreateIndex
CREATE INDEX "Job_experienceLevel_idx" ON "Job"("experienceLevel");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
