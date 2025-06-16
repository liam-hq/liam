begin;

-- Rename messages table to timeline_items
ALTER TABLE "public"."messages" RENAME TO "timeline_items";

-- Rename primary key constraint
ALTER TABLE "public"."timeline_items" RENAME CONSTRAINT "messages_pkey" TO "timeline_items_pkey";

-- Rename foreign key constraints
ALTER TABLE "public"."timeline_items" RENAME CONSTRAINT "messages_design_session_id_fkey" TO "timeline_items_design_session_id_fkey";
ALTER TABLE "public"."timeline_items" RENAME CONSTRAINT "messages_user_id_fkey" TO "timeline_items_user_id_fkey";
ALTER TABLE "public"."timeline_items" RENAME CONSTRAINT "messages_organization_id_fkey" TO "timeline_items_organization_id_fkey";

-- Rename indexes
ALTER INDEX "idx_messages_design_session_created_at" RENAME TO "idx_timeline_items_design_session_created_at";
ALTER INDEX "idx_messages_role_created_at" RENAME TO "idx_timeline_items_role_created_at";
ALTER INDEX "idx_messages_user_id_created_at" RENAME TO "idx_timeline_items_user_id_created_at";
ALTER INDEX "messages_building_schema_version_id_idx" RENAME TO "timeline_items_building_schema_version_id_idx";
ALTER INDEX "messages_schema_version_role_idx" RENAME TO "timeline_items_schema_version_role_idx";

-- Drop existing RLS policies
DROP POLICY IF EXISTS "authenticated_users_can_select_org_messages" ON "public"."timeline_items";
DROP POLICY IF EXISTS "authenticated_users_can_insert_org_messages" ON "public"."timeline_items";
DROP POLICY IF EXISTS "authenticated_users_can_update_org_messages" ON "public"."timeline_items";
DROP POLICY IF EXISTS "service_role_can_select_all_messages" ON "public"."timeline_items";
DROP POLICY IF EXISTS "service_role_can_insert_all_messages" ON "public"."timeline_items";
DROP POLICY IF EXISTS "service_role_can_update_all_messages" ON "public"."timeline_items";

-- Create new RLS policies with updated names
CREATE POLICY "authenticated_users_can_select_org_timeline_items" 
  ON "public"."timeline_items" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_timeline_items" 
  ON "public"."timeline_items" 
  IS 'Authenticated users can only view timeline items belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_timeline_items" 
  ON "public"."timeline_items" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_timeline_items" 
  ON "public"."timeline_items" 
  IS 'Authenticated users can only create timeline items in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_timeline_items" 
  ON "public"."timeline_items" 
  FOR UPDATE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  ))) 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_timeline_items" 
  ON "public"."timeline_items" 
  IS 'Authenticated users can only update timeline items in organizations they are members of';

CREATE POLICY "service_role_can_select_all_timeline_items" 
  ON "public"."timeline_items" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_timeline_items" 
  ON "public"."timeline_items" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_timeline_items" 
  ON "public"."timeline_items" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

-- Update trigger and function names
DROP TRIGGER IF EXISTS "set_messages_organization_id_trigger" ON "public"."timeline_items";

CREATE OR REPLACE FUNCTION "public"."set_timeline_items_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."design_sessions" 
    WHERE "id" = NEW.design_session_id
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_timeline_items_organization_id"() OWNER TO "postgres";

CREATE TRIGGER "set_timeline_items_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."timeline_items"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_timeline_items_organization_id"();

-- Update grants for new function
GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "service_role";

-- Update realtime publication (with error handling for tables that might not exist)
DO $$
BEGIN
    -- Try to drop messages from publication if it exists
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE messages;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist in publication, continue
        NULL;
    END;
    
    -- Try to drop timeline_items if it already exists to avoid conflicts  
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE timeline_items;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist in publication, continue
        NULL;
    END;
    
    -- Add timeline_items to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE timeline_items;
END $$;

commit;