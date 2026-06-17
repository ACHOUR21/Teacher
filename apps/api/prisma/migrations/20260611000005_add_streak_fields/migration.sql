-- Migration: Add streak fields to UserPoints
-- These fields already exist in the schema from the initial migration.
-- This migration adds a performance index on the gamification leaderboard query
-- and ensures streak fields have proper defaults.

-- Add index for tenant-level leaderboard queries on GamificationEvent
CREATE INDEX IF NOT EXISTS "GamificationEvent_userId_eventType_createdAt_idx"
  ON "GamificationEvent" ("userId", "eventType", "createdAt");

-- Add index to support period-based leaderboard groupBy queries
CREATE INDEX IF NOT EXISTS "GamificationEvent_tenantUser_createdAt_idx"
  ON "GamificationEvent" ("userId", "createdAt", "xpAwarded");

-- Ensure UserPoints has streak fields with defaults (already present, safe to run)
ALTER TABLE "UserPoints"
  ALTER COLUMN "streak" SET DEFAULT 0,
  ALTER COLUMN "longestStreak" SET DEFAULT 0;
