ALTER TABLE "AgentProfile" ADD COLUMN "followUp" TEXT;
ALTER TABLE "Note" ADD COLUMN "aboutAgentId" TEXT;
CREATE INDEX "Note_aboutAgentId_idx" ON "Note"("aboutAgentId");
ALTER TABLE "Note" ADD CONSTRAINT "Note_aboutAgentId_fkey" FOREIGN KEY ("aboutAgentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
