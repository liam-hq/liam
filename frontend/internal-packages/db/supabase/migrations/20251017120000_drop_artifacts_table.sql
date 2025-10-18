-- Migration: Drop artifacts table and all related database objects
-- Purpose: Remove the artifacts table following the deletion of @liam-hq/artifact package
-- Background: The @liam-hq/artifact package was removed in PR #2991, and type definitions
--             were migrated to @liam-hq/agent. All application code references to the
--             artifacts table have been removed, so we can now safely drop the database objects.
-- Affected: artifacts table, related triggers, functions, policies, indexes, and constraints
-- Related PR: liam-hq/liam#2991
--
-- IMPORTANT: This migration is destructive and cannot be rolled back automatically.
--            Ensure you have a database backup before applying this migration.

BEGIN;

-- Step 1: Remove the artifacts table from the realtime publication
-- This ensures no real-time subscriptions are active before dropping the table
-- Note: ALTER PUBLICATION doesn't support IF EXISTS, so we handle errors gracefully
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE "public"."artifacts";
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table artifacts was not in publication supabase_realtime';
    WHEN undefined_object THEN
        RAISE NOTICE 'Publication supabase_realtime does not exist';
END $$;

-- Step 2: Drop RLS policies
-- Drop all Row Level Security policies before dropping the table
DROP POLICY IF EXISTS "authenticated_users_can_delete_org_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "authenticated_users_can_insert_org_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "authenticated_users_can_select_org_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "authenticated_users_can_update_org_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "public_artifacts_read" ON "public"."artifacts";
DROP POLICY IF EXISTS "service_role_can_delete_all_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "service_role_can_insert_all_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "service_role_can_select_all_artifacts" ON "public"."artifacts";
DROP POLICY IF EXISTS "service_role_can_update_all_artifacts" ON "public"."artifacts";

-- Step 3: Drop triggers
-- Drop triggers before dropping the functions they depend on
DROP TRIGGER IF EXISTS "set_artifacts_organization_id_trigger" ON "public"."artifacts";
DROP TRIGGER IF EXISTS "update_artifacts_updated_at_trigger" ON "public"."artifacts";

-- Step 4: Drop indexes
-- Drop indexes to improve drop table performance
DROP INDEX IF EXISTS "public"."idx_artifacts_design_session_created";

-- Step 5: Drop the artifacts table
-- This will cascade and drop all remaining constraints (primary key, unique, foreign keys)
-- CASCADE ensures all dependent objects are dropped
DROP TABLE IF EXISTS "public"."artifacts" CASCADE;

-- Step 6: Drop functions
-- Drop the trigger functions now that the table and triggers are gone
DROP FUNCTION IF EXISTS "public"."set_artifacts_organization_id"();
DROP FUNCTION IF EXISTS "public"."update_artifacts_updated_at"();

-- Step 7: Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: artifacts table and all related objects have been dropped';
    RAISE NOTICE 'Dropped objects: table, 9 RLS policies, 2 triggers, 2 functions, 1 index, 4 constraints';
END $$;

COMMIT;

-- Rollback instructions:
-- This migration is destructive and removes all artifacts data permanently.
-- To rollback, you must:
-- 1. Restore the database from a backup taken before this migration
-- 2. Or re-run the following migrations in order:
--    - 20250626114915_add_artifacts_table.sql
--    - 20250814082520_create_public_share_realtime.sql (contains public_artifacts_read policy)
--    - 20250818143028_migrate_artifact_descriptions_to_array.sql
--    - 20250925081608_remove_nonfunctional_requirements_and_type.sql
