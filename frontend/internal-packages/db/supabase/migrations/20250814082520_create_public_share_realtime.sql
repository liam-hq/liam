-- Table to track which design sessions are publicly shared
create table if not exists "public"."public_share_settings" (
    "design_session_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"() not null
);
alter table "public"."public_share_settings" owner to "postgres";

-- Constraints and indexes
alter table only "public"."public_share_settings"
    add constraint "public_share_settings_pkey" primary key ("design_session_id");

create index "idx_public_share_settings_created_at" on "public"."public_share_settings" using "btree" ("created_at");

alter table only "public"."public_share_settings"
    add constraint "public_share_settings_design_session_id_fkey" foreign key ("design_session_id") references "public"."design_sessions"("id") on update cascade on delete cascade;

-- Enable RLS for public_share_settings
alter table "public"."public_share_settings" enable row level security;

-- RLS policies for authenticated users to manage their organization's public shares
create policy "authenticated_users_can_delete_org_public_share_settings" on "public"."public_share_settings" for delete to "authenticated" using (("design_session_id" in ( select "ds"."id"
   from "public"."design_sessions" "ds"
  where ("ds"."organization_id" in ( select "organization_members"."organization_id"
           from "public"."organization_members"
          where ("organization_members"."user_id" = "auth"."uid"()))))));

create policy "authenticated_users_can_insert_org_public_share_settings" on "public"."public_share_settings" for insert to "authenticated" with check (("design_session_id" in ( select "ds"."id"
   from "public"."design_sessions" "ds"
  where ("ds"."organization_id" in ( select "organization_members"."organization_id"
           from "public"."organization_members"
          where ("organization_members"."user_id" = "auth"."uid"()))))));

create policy "authenticated_users_can_select_org_public_share_settings" on "public"."public_share_settings" for select to "authenticated" using (("design_session_id" in ( select "ds"."id"
   from "public"."design_sessions" "ds"
  where ("ds"."organization_id" in ( select "organization_members"."organization_id"
           from "public"."organization_members"
          where ("organization_members"."user_id" = "auth"."uid"()))))));

-- RLS policy for anonymous users to read public_share_settings
create policy "public_share_settings_read" on "public"."public_share_settings" for select to "anon" using (true);

-- RLS policies for anonymous users to read data from original tables
-- These policies ensure anon users can access data only for publicly shared sessions
create policy "public_artifacts_read" on "public"."artifacts" for select to "anon" using (("design_session_id" in ( select "public_share_settings"."design_session_id"
   from "public"."public_share_settings")));

create policy "public_building_schema_versions_read" on "public"."building_schema_versions" for select to "anon" using (("building_schema_id" in ( select "bs"."id"
   from "public"."building_schemas" "bs"
  where ("bs"."design_session_id" in ( select "public_share_settings"."design_session_id"
           from "public"."public_share_settings")))));

create policy "public_building_schemas_read" on "public"."building_schemas" for select to "anon" using (("design_session_id" in ( select "public_share_settings"."design_session_id"
   from "public"."public_share_settings")));

create policy "public_sessions_read" on "public"."design_sessions" for select to "anon" using (("id" in ( select "public_share_settings"."design_session_id"
   from "public"."public_share_settings")));

create policy "public_timeline_items_read" on "public"."timeline_items" for select to "anon" using (("design_session_id" in ( select "public_share_settings"."design_session_id"
   from "public"."public_share_settings")));

-- Grant SELECT permissions on base tables to anonymous users
-- These work in conjunction with RLS policies to allow secure access
grant select on table "public"."public_share_settings" to "anon";

-- design_sessions
grant select ("id", "name", "created_at", "parent_design_session_id")
  on table "public"."design_sessions" to "anon";

-- artifacts
grant select ("id", "design_session_id", "artifact", "created_at", "updated_at")
  on table "public"."artifacts" to "anon";

-- timeline_items
grant select ("id", "design_session_id", "content", "created_at", "updated_at",
  "building_schema_version_id", "type", "query_result_id", "assistant_role")
  on table "public"."timeline_items" to "anon";

-- building_schemas
grant select ("id", "design_session_id", "schema", "created_at", "git_sha",
  "initial_schema_snapshot", "schema_file_path")
  on table "public"."building_schemas" to "anon";

-- building_schema_versions
grant select ("id", "building_schema_id", "number", "created_at", "patch", "reverse_patch")
  on table "public"."building_schema_versions" to "anon";
