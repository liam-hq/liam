BEGIN;

ALTER TABLE "public"."migration_pull_request_mappings" ADD COLUMN "organization_id" UUID;

UPDATE "public"."migration_pull_request_mappings" mprm
SET "organization_id" = (
  SELECT pr."organization_id"
  FROM "public"."github_pull_requests" pr
  WHERE pr."id" = mprm."pull_request_id"
  LIMIT 1
);

ALTER TABLE "public"."migration_pull_request_mappings" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."migration_pull_request_mappings" 
  ADD CONSTRAINT "migration_pull_request_mappings_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."github_pull_requests" 
    WHERE "id" = NEW.pull_request_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_migration_pull_request_mappings_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."migration_pull_request_mappings"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_migration_pull_request_mappings_organization_id"();

ALTER TABLE "public"."migration_pull_request_mappings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_migration_pull_request_mappings" 
  ON "public"."migration_pull_request_mappings" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_migration_pull_request_mappings" 
  ON "public"."migration_pull_request_mappings" 
  IS 'Authenticated users can only view mappings belonging to organizations they are members of';

CREATE POLICY "service_role_can_select_all_migration_pull_request_mappings" 
  ON "public"."migration_pull_request_mappings" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_migration_pull_request_mappings" 
  ON "public"."migration_pull_request_mappings" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
