/*
  Warnings:

  - You are about to drop the column `suggestions` on the `PerformanceReport` table. All the data in the column will be lost.
  - Added the required column `platformConnectionId` to the `PerformanceReport` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "TargetTier" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('BIO', 'TWEET', 'VOLUME', 'FOLLOWING', 'REPLY', 'COMMIT', 'PR', 'ISSUE');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('PERFORMANCE_REPORT', 'CONTENT_SUGGESTION', 'CUSTOM_PROMPT');

-- AlterTable
ALTER TABLE "PerformanceReport" DROP COLUMN "suggestions",
ADD COLUMN     "includedInContext" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "platformConnectionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlatformConnection" ADD COLUMN     "platformAspiration" TEXT,
ADD COLUMN     "platformRole" TEXT,
ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetTier" "TargetTier" NOT NULL DEFAULT 'BEGINNER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aspiration" TEXT,
ADD COLUMN     "creditsRemaining" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "targetCloudVolume" TEXT,
ADD COLUMN     "tier" "UserTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "ContentSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformConnectionId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestionType" "SuggestionType" NOT NULL,
    "content" TEXT NOT NULL,
    "customPrompt" TEXT,
    "basedOnReportId" TEXT,
    "includedInContext" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContentSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditsAmount" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageType" "UsageType" NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platformType" "PlatformType",
    "errorMessage" TEXT,

    CONSTRAINT "UsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSuggestion_userId_generatedAt_idx" ON "ContentSuggestion"("userId", "generatedAt");

-- CreateIndex
CREATE INDEX "ContentSuggestion_platformConnectionId_generatedAt_idx" ON "ContentSuggestion"("platformConnectionId", "generatedAt");

-- CreateIndex
CREATE INDEX "CreditPurchase_userId_purchasedAt_idx" ON "CreditPurchase"("userId", "purchasedAt");

-- CreateIndex
CREATE INDEX "UsageHistory_userId_createdAt_idx" ON "UsageHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageHistory_userId_usageType_successful_idx" ON "UsageHistory"("userId", "usageType", "successful");

-- CreateIndex
CREATE INDEX "PerformanceReport_userId_generatedAt_idx" ON "PerformanceReport"("userId", "generatedAt");

-- CreateIndex
CREATE INDEX "PerformanceReport_platformConnectionId_generatedAt_idx" ON "PerformanceReport"("platformConnectionId", "generatedAt");

-- AddForeignKey
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_platformConnectionId_fkey" FOREIGN KEY ("platformConnectionId") REFERENCES "PlatformConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSuggestion" ADD CONSTRAINT "ContentSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSuggestion" ADD CONSTRAINT "ContentSuggestion_platformConnectionId_fkey" FOREIGN KEY ("platformConnectionId") REFERENCES "PlatformConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageHistory" ADD CONSTRAINT "UsageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
