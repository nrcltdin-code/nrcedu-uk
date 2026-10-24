-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "upgradeCompanyName" TEXT,
ADD COLUMN     "upgradeNote" TEXT,
ADD COLUMN     "upgradeRegistrationNumber" TEXT,
ADD COLUMN     "upgradeRequestedAt" TIMESTAMP(3),
ADD COLUMN     "upgradeStatus" "ApprovalStatus";

-- CreateIndex
CREATE INDEX "AgentProfile_upgradeStatus_idx" ON "AgentProfile"("upgradeStatus");
