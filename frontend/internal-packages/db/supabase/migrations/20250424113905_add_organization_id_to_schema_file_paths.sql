BEGIN;

ALTER TABLE "public"."schema_file_paths" ADD COLUMN "organization_id" UUID;

UPDATE "public"."schema_file_paths" sfp
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."projects" p
  WHERE p."id" = sfp."project_id"
  LIMIT 1
);

ALTER TABLE "public"."schema_file_paths" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."schema_file_paths" 
  ADD CONSTRAINT "schema_file_paths_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_schema_file_paths_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."projects" 
    WHERE "id" = NEW.project_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_schema_file_paths_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."schema_file_paths"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_schema_file_paths_organization_id"();

ALTER TABLE "public"."schema_file_paths" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
  IS 'Authenticated users can only view schema file paths belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
  IS 'Authenticated users can only create schema file paths in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_schema_file_paths" 
  ON "public"."schema_file_paths" 
  IS 'Authenticated users can only update schema file paths in organizations they are members of';

CREATE POLICY "service_role_can_select_all_schema_file_paths" 
  ON "public"."schema_file_paths" 
  FOR SELECT TO "service_role" 
  USING (true);

COMMIT;
