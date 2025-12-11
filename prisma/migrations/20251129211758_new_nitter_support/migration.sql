-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "hasMedia" BOOLEAN DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN DEFAULT false,
ADD COLUMN     "isQuote" BOOLEAN DEFAULT false,
ADD COLUMN     "isRetweet" BOOLEAN DEFAULT false,
ADD COLUMN     "mediaUrls" TEXT[],
ADD COLUMN     "videoDuration" TEXT;
