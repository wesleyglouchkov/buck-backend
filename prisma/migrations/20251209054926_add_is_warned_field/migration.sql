-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "isWarnedTimes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "isWarnedTimes" INTEGER NOT NULL DEFAULT 0;
