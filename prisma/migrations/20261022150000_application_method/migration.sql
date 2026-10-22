-- CreateEnum
CREATE TYPE "ApplicationMethod" AS ENUM ('DIRECT_PORTAL', 'AGENT_PORTAL', 'EMAIL', 'UCAS', 'OTHER');

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "applicationMethod" "ApplicationMethod",
ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "applicationEmail" TEXT;
