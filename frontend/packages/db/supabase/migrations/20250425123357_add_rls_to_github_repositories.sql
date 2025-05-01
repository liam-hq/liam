-- TODO: Remove anonkey when using RPC in the future
BEGIN;

ALTER TABLE "public"."github_repositories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_github_repositories" 
  ON "public"."github_repositories" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_github_repositories" 
  ON "public"."github_repositories" 
  IS 'Authenticated users can only view repositories belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_github_repositories" 
  ON "public"."github_repositories" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_github_repositories" 
  ON "public"."github_repositories" 
  IS 'Authenticated users can only create repositories in organizations they are members of';

CREATE POLICY "service_role_can_select_all_github_repositories" 
  ON "public"."github_repositories" 
  FOR SELECT TO "service_role" 
  USING (true);

COMMIT;
