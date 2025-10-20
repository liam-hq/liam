-- Migration: Drop artifacts table and all related objects
-- Purpose: Remove artifacts table after migrating types to @liam-hq/agent package
-- Related PR: liam-hq/liam#2991
-- Related Issue: liam-hq/liam-internal#5853

begin;

-- Drop RLS policies first
drop policy if exists "public_artifacts_read" on "public"."artifacts";
drop policy if exists "authenticated_users_can_delete_org_artifacts" on "public"."artifacts";
drop policy if exists "authenticated_users_can_insert_org_artifacts" on "public"."artifacts";
drop policy if exists "authenticated_users_can_select_org_artifacts" on "public"."artifacts";
drop policy if exists "authenticated_users_can_update_org_artifacts" on "public"."artifacts";
drop policy if exists "service_role_can_select_all_artifacts" on "public"."artifacts";
drop policy if exists "service_role_can_insert_all_artifacts" on "public"."artifacts";
drop policy if exists "service_role_can_update_all_artifacts" on "public"."artifacts";
drop policy if exists "service_role_can_delete_all_artifacts" on "public"."artifacts";

-- Drop triggers
drop trigger if exists "set_artifacts_organization_id_trigger" on "public"."artifacts";
drop trigger if exists "update_artifacts_updated_at_trigger" on "public"."artifacts";

-- Remove table from realtime publication if it exists
do $$
begin
  -- Check if the table is in the publication
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'artifacts'
  ) then
    alter publication supabase_realtime drop table artifacts;
  end if;
end $$;

-- Drop indexes (will be dropped automatically with table, but explicit for clarity)
drop index if exists "public"."idx_artifacts_design_session_created";

-- Drop the table (foreign keys and constraints will cascade)
drop table if exists "public"."artifacts";

-- Drop functions
drop function if exists "public"."set_artifacts_organization_id"();
drop function if exists "public"."update_artifacts_updated_at"();

commit;
