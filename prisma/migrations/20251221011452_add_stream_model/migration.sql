/*
  Warnings:

  - You are about to drop the `analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[creatorId,memberId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fee` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "analytics" DROP CONSTRAINT "analytics_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "content" DROP CONSTRAINT "content_creatorId_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "fee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subscriptionPrice" DECIMAL(10,2);

-- DropTable
DROP TABLE "analytics";

-- DropTable
DROP TABLE "content";

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streams" (
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
CREATE TABLE "stream_chats" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stream_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flagged_content" (
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
CREATE UNIQUE INDEX "follows_followerId_followedId_key" ON "follows"("followerId", "followedId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_creatorId_memberId_key" ON "subscriptions"("creatorId", "memberId");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_chats" ADD CONSTRAINT "stream_chats_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_chats" ADD CONSTRAINT "stream_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_flaggedMsgId_fkey" FOREIGN KEY ("flaggedMsgId") REFERENCES "stream_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flagged_content" ADD CONSTRAINT "flagged_content_livestreamId_fkey" FOREIGN KEY ("livestreamId") REFERENCES "streams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
