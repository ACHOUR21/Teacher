-- AddColumn: SCIM provisioning fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scimExternalId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scimManaged" BOOLEAN NOT NULL DEFAULT false;
