-- Migration: Add organization_id and RLS to documents table
-- This migration adds an organization_id column to the documents table,
-- enables Row Level Security, and creates policies for authenticated users and service_role

BEGIN;

-- Add organization_id column to documents table
ALTER TABLE "public"."documents"
  ADD COLUMN "organization_id" uuid NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE;

-- Enable RLS on the documents table
ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT operations for authenticated users
CREATE POLICY "authenticated_users_can_select_org_documents"
  ON "public"."documents"
  FOR SELECT TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_documents"
  ON "public"."documents"
  IS 'Authenticated users can only view documents in organizations they are members of';

-- Policy for INSERT operations for authenticated users
CREATE POLICY "authenticated_users_can_insert_org_documents"
  ON "public"."documents"
  FOR INSERT TO "authenticated"
  WITH CHECK (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_documents"
  ON "public"."documents"
  IS 'Authenticated users can only add documents to organizations they are members of';

-- Policy for UPDATE operations for authenticated users
CREATE POLICY "authenticated_users_can_update_org_documents"
  ON "public"."documents"
  FOR UPDATE TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_documents"
  ON "public"."documents"
  IS 'Authenticated users can only update documents in organizations they are members of';

-- Policy for DELETE operations for authenticated users
CREATE POLICY "authenticated_users_can_delete_org_documents"
  ON "public"."documents"
  FOR DELETE TO "authenticated"
  USING (("organization_id" IN (
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE "organization_members"."user_id" = "auth"."uid"()
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_documents"
  ON "public"."documents"
  IS 'Authenticated users can only delete documents in organizations they are members of';

-- Service role policies for all operations (for background jobs, etc.)
CREATE POLICY "service_role_can_select_all_documents"
  ON "public"."documents"
  FOR SELECT TO "service_role"
  USING (true);

CREATE POLICY "service_role_can_insert_all_documents"
  ON "public"."documents"
  FOR INSERT TO "service_role"
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_documents"
  ON "public"."documents"
  FOR UPDATE TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_documents"
  ON "public"."documents"
  FOR DELETE TO "service_role"
  USING (true);

COMMIT;
