-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "addedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agentTeamId" TEXT;

-- CreateIndex
CREATE INDEX "StudentProfile_addedById_idx" ON "StudentProfile"("addedById");

-- CreateIndex
CREATE INDEX "User_agentTeamId_idx" ON "User"("agentTeamId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentTeamId_fkey" FOREIGN KEY ("agentTeamId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
