/*
 * Purpose: Modify the migrations table structure
 * Changes:
 * 1. Add project_id column
 * 2. Migrate data from pull_request_id to project_id using project_repository_mappings
 * 3. Remove pull_request_id column and its foreign key constraint
 */

begin;

-- Step 1: Add project_id column (initially nullable)
alter table "public"."migrations"
add column "project_id" uuid references "public"."projects"("id") on update cascade on delete restrict;

-- Step 2: Migrate data - set project_id based on the repository associated with the pull request
-- This uses project_repository_mappings to find the correct project for each migration
update "public"."migrations" m
set "project_id" = (
  select prm."project_id"
  from "public"."github_pull_requests" pr
  join "public"."project_repository_mappings" prm on pr."repository_id" = prm."repository_id"
  where pr."id" = m."pull_request_id"
  limit 1
);

-- Step 3: Handle any migrations that couldn't be mapped to a project
-- Check if there are any NULL project_ids after the update
do $$
declare
  null_count integer;
begin
  select count(*) into null_count from "public"."migrations" where "project_id" is null;

  if null_count > 0 then
    raise exception 'Migration failed: % migrations could not be mapped to a project', null_count;
  end if;
end $$;

-- Step 4: Make project_id not null after successful migration
alter table "public"."migrations"
alter column "project_id" set not null;

-- Step 5: Drop the foreign key constraint on pull_request_id
alter table "public"."migrations"
drop constraint "migration_pull_request_id_fkey";

-- Step 6: Drop the unique index on pull_request_id
drop index "public"."migration_pull_request_id_key";

-- Step 7: Remove the pull_request_id column
alter table "public"."migrations"
drop column "pull_request_id";

commit;
