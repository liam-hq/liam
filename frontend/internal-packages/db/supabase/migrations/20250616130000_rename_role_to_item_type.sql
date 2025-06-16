begin;

-- Rename the enum type from message_role_enum to timeline_item_type_enum
ALTER TYPE "public"."message_role_enum" RENAME TO "timeline_item_type_enum";

-- Rename the role column to item_type in timeline_items table
ALTER TABLE "public"."timeline_items" RENAME COLUMN "role" TO "item_type";

-- Rename indexes that reference the old column name
ALTER INDEX "idx_timeline_items_role_created_at" RENAME TO "idx_timeline_items_item_type_created_at";
ALTER INDEX "timeline_items_schema_version_role_idx" RENAME TO "timeline_items_schema_version_item_type_idx";

-- Update the existing partial index condition to use the new column name
DROP INDEX IF EXISTS "timeline_items_schema_version_item_type_idx";
CREATE INDEX "timeline_items_schema_version_item_type_idx" ON "public"."timeline_items" ("design_session_id", "created_at") 
WHERE "item_type" = 'schema_version';

commit;