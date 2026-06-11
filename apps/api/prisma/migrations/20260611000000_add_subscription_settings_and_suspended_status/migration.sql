-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
