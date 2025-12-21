/*
  Warnings:

  - You are about to drop the `analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[creatorId,memberId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fee` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
-- DropForeignKey if exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'analytics_creatorId_fkey') THEN
        ALTER TABLE "analytics" DROP CONSTRAINT "analytics_creatorId_fkey";
    END IF;
END $$;

-- DropForeignKey if exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'content_creatorId_fkey') THEN
        ALTER TABLE "content" DROP CONSTRAINT "content_creatorId_fkey";
    END IF;
END $$;

-- Clean up potentially incompatible data from subscriptions table
DELETE FROM "subscriptions";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "creatorId" TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "fee" DECIMAL(10,2) NOT NULL,
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionPrice" DECIMAL(10,2);

-- DropTable
DROP TABLE IF EXISTS "analytics";

-- DropTable
DROP TABLE IF EXISTS "content";

-- CreateTable
CREATE TABLE IF NOT EXISTS "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "streams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "workoutType" TEXT,
    "thumbnail" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "replayUrl" TEXT,
    "agoraChannelId" TEXT,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "recordingId" TEXT,
    "resourceId" TEXT,
    "recordingSid" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "stream_chats" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stream_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "flagged_content" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "flaggedMsgId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reporterComment" TEXT,
    "livestreamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flagged_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "follows_followerId_followedId_key" ON "follows"("followerId", "followedId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_creatorId_memberId_key" ON "subscriptions"("creatorId", "memberId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'follows_followerId_fkey') THEN
        ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'follows_followedId_fkey') THEN
        ALTER TABLE "follows" ADD CONSTRAINT "follows_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subscriptions_creatorId_fkey') THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'streams_creatorId_fkey') THEN
        ALTER TABLE "streams" ADD CONSTRAINT "streams_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stream_chats_streamId_fkey') THEN
        ALTER TABLE "stream_chats" ADD CONSTRAINT "stream_chats_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stream_chats_userId_fkey') THEN
        ALTER TABLE "stream_chats" ADD CONSTRAINT "stream_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'flagged_content_senderId_fkey') THEN
        ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'flagged_content_reporterId_fkey') THEN
        ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'flagged_content_flaggedMsgId_fkey') THEN
        ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_flaggedMsgId_fkey" FOREIGN KEY ("flaggedMsgId") REFERENCES "stream_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'flagged_content_livestreamId_fkey') THEN
        ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_livestreamId_fkey" FOREIGN KEY ("livestreamId") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
