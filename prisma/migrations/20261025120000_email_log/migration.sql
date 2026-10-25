-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('OFF', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "text" TEXT,
    "kind" TEXT,
    "attachments" INTEGER NOT NULL DEFAULT 0,
    "status" "EmailStatus" NOT NULL,
    "error" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_providerId_key" ON "EmailLog"("providerId");
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");
