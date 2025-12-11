/*
  Warnings:

  - The values [INSTAGRAM,LINKEDIN] on the enum `PlatformType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,platform]` on the table `PlatformConnection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[platformConnId,postId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `PlatformConnection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlatformType_new" AS ENUM ('X', 'GITHUB');
ALTER TABLE "PlatformConnection" ALTER COLUMN "platform" TYPE "PlatformType_new" USING ("platform"::text::"PlatformType_new");
ALTER TYPE "PlatformType" RENAME TO "PlatformType_old";
ALTER TYPE "PlatformType_new" RENAME TO "PlatformType";
DROP TYPE "PlatformType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Metric" ALTER COLUMN "likes" DROP NOT NULL,
ALTER COLUMN "comments" DROP NOT NULL,
ALTER COLUMN "shares" DROP NOT NULL,
ALTER COLUMN "views" DROP NOT NULL,
ALTER COLUMN "stars" DROP NOT NULL,
ALTER COLUMN "profileClicks" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PlatformConnection" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "scopes" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "accessToken" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConnection_userId_platform_key" ON "PlatformConnection"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Post_platformConnId_postId_key" ON "Post"("platformConnId", "postId");
