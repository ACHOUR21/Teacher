-- Migration: add_api_keys
-- Adds userId to ApiKey model, user relation, and composite index.
-- Also migrates existing rows from cuid() to uuid() ids for new keys going forward.

-- Step 1: Add userId column (nullable first so existing rows don't break)
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 2: Backfill userId with a placeholder admin or first user in tenant
-- In production this would be handled with a data migration script.
-- For now set existing rows to the first user in that tenant.
UPDATE "ApiKey" ak
SET "userId" = (
  SELECT u.id FROM "User" u WHERE u."tenantId" = ak."tenantId" LIMIT 1
)
WHERE ak."userId" IS NULL;

-- Step 3: Add NOT NULL constraint now that rows are filled
ALTER TABLE "ApiKey" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Add composite index for fast active-key lookups per tenant
CREATE INDEX IF NOT EXISTS "ApiKey_tenantId_isActive_idx" ON "ApiKey"("tenantId", "isActive");
