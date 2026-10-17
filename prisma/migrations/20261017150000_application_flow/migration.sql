-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'APPROVED', 'NEEDS_REUPLOAD', 'WAIVED');

-- AlterEnum: keep existing rows. Old "Offer received" becomes Conditional offer, old "Deposit / CAS" becomes Deposit paid.
ALTER TYPE "ApplicationStage" RENAME VALUE 'OFFER_RECEIVED' TO 'CONDITIONAL_OFFER';
ALTER TYPE "ApplicationStage" RENAME VALUE 'DEPOSIT_CAS' TO 'DEPOSIT_PAID';
ALTER TYPE "ApplicationStage" ADD VALUE 'READY_TO_SUBMIT' AFTER 'DOCUMENTS_PENDING';
ALTER TYPE "ApplicationStage" ADD VALUE 'UNIVERSITY_QUERY' AFTER 'SUBMITTED_TO_UNIVERSITY';
ALTER TYPE "ApplicationStage" ADD VALUE 'UNCONDITIONAL_OFFER' AFTER 'CONDITIONAL_OFFER';
ALTER TYPE "ApplicationStage" ADD VALUE 'OFFER_ACCEPTED' AFTER 'UNCONDITIONAL_OFFER';
ALTER TYPE "ApplicationStage" ADD VALUE 'CAS_REQUESTED' AFTER 'DEPOSIT_PAID';
ALTER TYPE "ApplicationStage" ADD VALUE 'CAS_ISSUED' AFTER 'CAS_REQUESTED';
ALTER TYPE "ApplicationStage" ADD VALUE 'REJECTED' AFTER 'ENROLLED';
ALTER TYPE "ApplicationStage" ADD VALUE 'OFFER_DECLINED' AFTER 'REJECTED';

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "canStartApplications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "casNumber" TEXT,
ADD COLUMN     "depositAmount" DECIMAL(12,2),
ADD COLUMN     "universityRef" TEXT,
ADD COLUMN     "visaReference" TEXT;

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "confirmationName" TEXT NOT NULL DEFAULT 'CAS',
ADD COLUMN     "processNotes" TEXT,
ADD COLUMN     "skippedStages" "ApplicationStage"[];

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "DocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "instructions" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "dueAt" DATE,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage",
    "note" TEXT,
    "visibleToStudent" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCondition" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metAt" TIMESTAMP(3),
    "metById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityRequirement" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "instructions" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UniversityRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentRequest_studentId_idx" ON "DocumentRequest"("studentId");

-- CreateIndex
CREATE INDEX "DocumentRequest_applicationId_idx" ON "DocumentRequest"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationCondition_applicationId_idx" ON "ApplicationCondition"("applicationId");

-- CreateIndex
CREATE INDEX "UniversityRequirement_universityId_idx" ON "UniversityRequirement"("universityId");

-- CreateIndex
CREATE INDEX "Document_requestId_idx" ON "Document"("requestId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DocumentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCondition" ADD CONSTRAINT "ApplicationCondition_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCondition" ADD CONSTRAINT "ApplicationCondition_metById_fkey" FOREIGN KEY ("metById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCondition" ADD CONSTRAINT "ApplicationCondition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityRequirement" ADD CONSTRAINT "UniversityRequirement_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Keep the stage history: every old entry becomes a stage event the student can see.
INSERT INTO "ApplicationEvent" ("id", "applicationId", "actorId", "type", "toStage", "note", "visibleToStudent", "createdAt")
SELECT "id", "applicationId", "changedById", 'stage', "stage", "note", true, "createdAt" FROM "ApplicationStageHistory";

-- DropTable
DROP TABLE "ApplicationStageHistory";
