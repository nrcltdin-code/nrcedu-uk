-- AlterTable
ALTER TABLE "AgentDocument" ADD COLUMN     "requestId" TEXT;

-- CreateTable
CREATE TABLE "AgentDocumentRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" "AgentDocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "instructions" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentDocumentRequest_agentId_isOpen_idx" ON "AgentDocumentRequest"("agentId", "isOpen");

-- CreateIndex
CREATE INDEX "AgentDocument_requestId_idx" ON "AgentDocument"("requestId");

-- AddForeignKey
ALTER TABLE "AgentDocument" ADD CONSTRAINT "AgentDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AgentDocumentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDocumentRequest" ADD CONSTRAINT "AgentDocumentRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentDocumentRequest" ADD CONSTRAINT "AgentDocumentRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
