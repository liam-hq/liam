begin;

-- add columns to building_schemas table
alter table "public"."building_schemas"
  add column "git_sha" "text",
  add column "initial_schema_snapshot" "jsonb",
  add column "schema_file_path" "text";

-- remove columns from design_sessions table
alter table "public"."design_sessions"
  drop column "git_sha",
  drop column "initial_schema_snapshot",
  drop column "schema_file_path";

commit;
