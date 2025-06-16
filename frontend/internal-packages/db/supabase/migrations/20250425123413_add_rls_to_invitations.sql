-- Enable RLS for invitations table
ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "authenticated_users_can_select_org_invitations"
  ON "public"."invitations"
  FOR SELECT TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

CREATE POLICY "authenticated_users_can_insert_org_invitations"
  ON "public"."invitations"
  FOR INSERT TO "authenticated"
  WITH CHECK (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

CREATE POLICY "authenticated_users_can_update_org_invitations"
  ON "public"."invitations"
  FOR UPDATE TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )))
  WITH CHECK (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

CREATE POLICY "authenticated_users_can_delete_org_invitations"
  ON "public"."invitations"
  FOR DELETE TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

-- Policies for service_role
CREATE POLICY "service_role_can_select_all_invitations"
  ON "public"."invitations"
  FOR SELECT TO "service_role"
  USING (true);

CREATE POLICY "service_role_can_insert_all_invitations"
  ON "public"."invitations"
  FOR INSERT TO "service_role"
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_invitations"
  ON "public"."invitations"
  FOR UPDATE TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_invitations"
  ON "public"."invitations"
  FOR DELETE TO "service_role"
  USING (true);
