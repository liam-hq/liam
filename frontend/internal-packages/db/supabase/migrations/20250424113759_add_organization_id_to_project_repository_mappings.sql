BEGIN;

ALTER TABLE "public"."project_repository_mappings" ADD COLUMN "organization_id" UUID;

UPDATE "public"."project_repository_mappings" prm
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."projects" p
  WHERE p."id" = prm."project_id"
  LIMIT 1
);

ALTER TABLE "public"."project_repository_mappings" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."project_repository_mappings" 
  ADD CONSTRAINT "project_repository_mappings_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_project_repository_mappings_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_project_repository_mappings_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."project_repository_mappings"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_project_repository_mappings_organization_id"();

ALTER TABLE "public"."project_repository_mappings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_project_repository_mappings" 
  ON "public"."project_repository_mappings" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_project_repository_mappings" 
  ON "public"."project_repository_mappings" 
  IS 'Authenticated users can only view project repository mappings belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_project_repository_mappings" 
  ON "public"."project_repository_mappings" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_project_repository_mappings" 
  ON "public"."project_repository_mappings" 
  IS 'Authenticated users can only create project repository mappings in organizations they are members of';

CREATE POLICY "service_role_can_select_all_project_repository_mappings" 
  ON "public"."project_repository_mappings" 
  FOR SELECT TO "service_role" 
  USING (true);

COMMIT;
