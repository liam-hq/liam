-- Migration: Add RLS to organization_members table
-- This migration enables Row Level Security on the organization_members table
-- and creates policies for authenticated users and service_role

BEGIN;

-- Enable RLS on the organization_members table
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT operations for authenticated users
-- Users can see organization members in organizations they are members of
CREATE POLICY "authenticated_users_can_select_org_organization_members"
  ON "public"."organization_members"
  FOR SELECT TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_organization_members" 
  ON "public"."organization_members" 
  IS 'Authenticated users can only view organization members in organizations they are members of';

-- Policy for INSERT operations for authenticated users
-- Users can add members to organizations they are members of
CREATE POLICY "authenticated_users_can_insert_org_organization_members"
  ON "public"."organization_members"
  FOR INSERT TO "authenticated"
  WITH CHECK (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_organization_members" 
  ON "public"."organization_members" 
  IS 'Authenticated users can only add members to organizations they are members of';

-- Policy for DELETE operations for authenticated users
-- Users can remove members from organizations they are members of
CREATE POLICY "authenticated_users_can_delete_org_organization_members"
  ON "public"."organization_members"
  FOR DELETE TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_organization_members" 
  ON "public"."organization_members" 
  IS 'Authenticated users can only remove members from organizations they are members of';

COMMIT;
