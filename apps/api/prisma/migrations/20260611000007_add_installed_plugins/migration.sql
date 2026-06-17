-- AlterTable: add new columns to Plugin
ALTER TABLE "Plugin" ADD COLUMN IF NOT EXISTS "author" TEXT;
ALTER TABLE "Plugin" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Plugin" ADD COLUMN IF NOT EXISTS "iconUrl" TEXT;
ALTER TABLE "Plugin" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Plugin" ADD COLUMN IF NOT EXISTS "screenshots" TEXT[] NOT NULL DEFAULT '{}';

-- AlterTable: add Tenant relation to InstalledPlugin + index
ALTER TABLE "InstalledPlugin" ADD COLUMN IF NOT EXISTS "tenantId_fk_added" BOOLEAN;
-- tenantId column already exists; add FK constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'InstalledPlugin_tenantId_fkey'
      AND table_name = 'InstalledPlugin'
  ) THEN
    ALTER TABLE "InstalledPlugin"
      ADD CONSTRAINT "InstalledPlugin_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InstalledPlugin_tenantId_idx" ON "InstalledPlugin"("tenantId");
