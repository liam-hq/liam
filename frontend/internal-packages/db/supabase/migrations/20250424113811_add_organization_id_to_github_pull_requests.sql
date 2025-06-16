BEGIN;

ALTER TABLE "public"."github_pull_requests" ADD COLUMN "organization_id" UUID;

UPDATE "public"."github_pull_requests" pr
SET "organization_id" = (
  SELECT r."organization_id"
  FROM "public"."github_repositories" r
  WHERE r."id" = pr."repository_id"
  LIMIT 1
);

ALTER TABLE "public"."github_pull_requests" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."github_pull_requests" 
  ADD CONSTRAINT "github_pull_requests_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_github_pull_requests_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."github_repositories" 
    WHERE "id" = NEW.repository_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_github_pull_requests_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."github_pull_requests"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_github_pull_requests_organization_id"();

ALTER TABLE "public"."github_pull_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_github_pull_requests" 
  ON "public"."github_pull_requests" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_github_pull_requests" 
  ON "public"."github_pull_requests" 
  IS 'Authenticated users can only view pull requests belonging to organizations they are members of';

CREATE POLICY "service_role_can_select_all_github_pull_requests" 
  ON "public"."github_pull_requests" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_github_pull_requests" 
  ON "public"."github_pull_requests" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
