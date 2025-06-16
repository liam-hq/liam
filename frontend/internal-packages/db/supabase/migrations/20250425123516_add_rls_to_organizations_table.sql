BEGIN;

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_organizations" 
  ON "public"."organizations" 
  FOR SELECT TO "authenticated" 
  USING (true);

COMMENT ON POLICY "authenticated_users_can_select_org_organizations" 
  ON "public"."organizations" 
  IS 'Authenticated users can only view organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_organizations" 
  ON "public"."organizations" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (true);

COMMENT ON POLICY "authenticated_users_can_insert_organizations" 
  ON "public"."organizations" 
  IS 'Authenticated users can create any organization';

CREATE POLICY "authenticated_users_can_update_org_organizations" 
  ON "public"."organizations" 
  FOR UPDATE TO "authenticated" 
  USING ((id IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_organizations" 
  ON "public"."organizations" 
  IS 'Authenticated users can only update organizations they are members of';
CREATE POLICY "authenticated_users_can_delete_org_organizations" 
  ON "public"."organizations" 
  FOR DELETE TO "authenticated" 
  USING ((id IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_organizations" 
  ON "public"."organizations" 
  IS 'Authenticated users can only delete organizations they are members of';

CREATE POLICY "service_role_can_select_all_organizations" 
  ON "public"."organizations" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_organizations" 
  ON "public"."organizations" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_organizations" 
  ON "public"."organizations" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_organizations" 
  ON "public"."organizations" 
  FOR DELETE TO "service_role" 
  USING (true);



COMMIT;
