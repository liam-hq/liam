-- Migration: Update migrations table structure
-- Adds project_id to migrations table
-- Removes pull_request_id from migrations table
-- Creates a new migration_pull_request_mappings table

BEGIN;

-- Step 1: Create the new migration_pull_request_mappings table
CREATE TABLE IF NOT EXISTS "public"."migration_pull_request_mappings" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "migration_id" "uuid" NOT NULL,
  "pull_request_id" "uuid" NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp(3) with time zone NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "migration_pull_request_mapping_migration_id_pull_request_id_key" UNIQUE ("migration_id", "pull_request_id")
);

-- Step 2: Add foreign key constraints to the new table
ALTER TABLE "public"."migration_pull_request_mappings"
  ADD CONSTRAINT "migration_pull_request_mapping_migration_id_fkey"
  FOREIGN KEY ("migration_id") REFERENCES "public"."migrations"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."migration_pull_request_mappings"
  ADD CONSTRAINT "migration_pull_request_mapping_pull_request_id_fkey"
  FOREIGN KEY ("pull_request_id") REFERENCES "public"."github_pull_requests"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- Step 3: Add project_id to migrations table
ALTER TABLE "public"."migrations"
  ADD COLUMN "project_id" "uuid";

-- Step 4: Migrate data - set project_id based on pull_request relationship
UPDATE "public"."migrations" m
SET "project_id" = (
  SELECT pr.project_id
  FROM "public"."github_pull_requests" gpr
  JOIN "public"."overall_reviews" pr ON gpr.id = pr.pull_request_id
  WHERE gpr.id = m.pull_request_id
  LIMIT 1
);

-- Step 5: Create mappings in the new table
INSERT INTO "public"."migration_pull_request_mappings" ("migration_id", "pull_request_id", "updated_at")
SELECT "id", "pull_request_id", CURRENT_TIMESTAMP
FROM "public"."migrations";

-- Step 6: Make project_id NOT NULL after data migration
ALTER TABLE "public"."migrations"
  ALTER COLUMN "project_id" SET NOT NULL;

-- Step 7: Add foreign key constraint for project_id
ALTER TABLE "public"."migrations"
  ADD CONSTRAINT "migration_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Step 8: Drop the pull_request_id column and its constraint
ALTER TABLE "public"."migrations"
  DROP CONSTRAINT "migration_pull_request_id_fkey";

ALTER TABLE "public"."migrations"
  DROP COLUMN "pull_request_id";

COMMIT;
