-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X', 'WHATSAPP', 'GOOGLE_BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('SOCIAL', 'EMAIL', 'SMS', 'ADS', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING', 'DESIGN', 'READY', 'LIVE', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContentPostStatus" AS ENUM ('IDEA', 'DESIGNING', 'READY', 'POSTED');

-- AlterEnum
ALTER TYPE "PermissionModule" ADD VALUE 'MARKETING';

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "handle" TEXT,
    "loginEmail" TEXT,
    "passwordEncrypted" TEXT,
    "twoFactorNote" TEXT,
    "managedBy" TEXT,
    "followers" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "goal" TEXT,
    "audience" TEXT,
    "message" TEXT,
    "designUrl" TEXT,
    "owner" TEXT,
    "results" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "publishOn" TIMESTAMP(3) NOT NULL,
    "status" "ContentPostStatus" NOT NULL DEFAULT 'IDEA',
    "caption" TEXT,
    "designUrl" TEXT,
    "postUrl" TEXT,
    "assignee" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referrer" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "Campaign_status_startDate_idx" ON "Campaign"("status", "startDate");

-- CreateIndex
CREATE INDEX "ContentPost_publishOn_idx" ON "ContentPost"("publishOn");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

