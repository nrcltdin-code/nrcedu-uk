-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "profileConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "profileConfirmedBy" TEXT,
ADD COLUMN     "educationConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "educationConfirmedBy" TEXT;
