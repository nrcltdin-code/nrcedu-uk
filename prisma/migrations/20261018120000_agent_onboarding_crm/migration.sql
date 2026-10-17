-- CreateEnum
CREATE TYPE "AgentKind" AS ENUM ('INDIVIDUAL', 'AGENCY');

-- CreateEnum
CREATE TYPE "AgentPermission" AS ENUM ('ALL_STUDENTS', 'LEADS', 'APPLICATIONS', 'DOCUMENTS', 'COMMISSION', 'TEAM');

-- CreateEnum
CREATE TYPE "AgentDocumentType" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'OFFICE_PHOTO', 'REFERENCE_LETTER', 'OTHER');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agentPermissions" "AgentPermission"[];

-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "kind" "AgentKind" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "studentsPerYear" INTEGER,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearsActive" INTEGER;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "agentUserId" TEXT,
ADD COLUMN     "followUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "agentId" TEXT;

-- CreateTable
CREATE TABLE "AgentDocument" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" "AgentDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentDocument_agentId_idx" ON "AgentDocument"("agentId");

-- AddForeignKey
ALTER TABLE "AgentDocument" ADD CONSTRAINT "AgentDocument_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDocument" ADD CONSTRAINT "AgentDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentUserId_fkey" FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing agents. Agents waiting for approval can now sign in to the onboarding page,
-- so their accounts are unlocked; approval still gates everything else.
UPDATE "User" SET "status" = 'ACTIVE'
WHERE "role" = 'AGENT' AND "status" = 'PENDING'
  AND "id" IN (SELECT "userId" FROM "AgentProfile" WHERE "approvalStatus" = 'PENDING');

-- Anyone who gave a company name or has a team was acting as an agency.
UPDATE "AgentProfile" SET "kind" = 'AGENCY'
WHERE "companyName" IS NOT NULL OR "id" IN (SELECT DISTINCT "agentTeamId" FROM "User" WHERE "agentTeamId" IS NOT NULL);

-- Team members keep what they could do before: their own students, applications and documents.
UPDATE "User" SET "agentPermissions" = ARRAY['APPLICATIONS', 'DOCUMENTS']::"AgentPermission"[]
WHERE "agentTeamId" IS NOT NULL;
