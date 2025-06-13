begin;

-- Add 'schema_version' to the existing message_role_enum
ALTER TYPE "public"."message_role_enum" ADD VALUE 'schema_version';

-- Add building_schema_version_id column to messages table
ALTER TABLE "public"."messages" 
ADD COLUMN "building_schema_version_id" "uuid" REFERENCES "public"."building_schema_versions"("id") ON DELETE CASCADE;

-- Add index for the new foreign key for performance
CREATE INDEX "messages_building_schema_version_id_idx" ON "public"."messages" ("building_schema_version_id");

commit;

-- Create the partial index in a separate transaction to avoid enum usage restriction
begin;

-- Add partial index for schema_version messages for efficient querying
CREATE INDEX "messages_schema_version_role_idx" ON "public"."messages" ("design_session_id", "created_at") 
WHERE "role" = 'schema_version';

commit;