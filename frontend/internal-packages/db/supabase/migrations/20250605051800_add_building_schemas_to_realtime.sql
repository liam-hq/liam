begin;

-- Add building_schemas table to realtime publication
alter publication supabase_realtime add table building_schemas;

-- Create index for performance optimization
create index if not exists "idx_building_schemas_design_session_created" on "public"."building_schemas" ("design_session_id", "created_at" desc);

commit;
