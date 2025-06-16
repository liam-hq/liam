
BEGIN;

ALTER TABLE "public"."knowledge_suggestions" ADD COLUMN "organization_id" UUID;

UPDATE "public"."knowledge_suggestions" ks
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."projects" p
  WHERE p."id" = ks."project_id"
  LIMIT 1
);

ALTER TABLE "public"."knowledge_suggestions" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."knowledge_suggestions" 
  ADD CONSTRAINT "knowledge_suggestions_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_knowledge_suggestions_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_knowledge_suggestions_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."knowledge_suggestions"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_knowledge_suggestions_organization_id"();

ALTER TABLE "public"."knowledge_suggestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_select_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  IS 'Authenticated users can only view knowledge suggestions belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  IS 'Authenticated users can only create knowledge suggestions in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  IS 'Authenticated users can only update knowledge suggestions in organizations they are members of';




CREATE POLICY "service_role_can_select_all_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_knowledge_suggestions" 
  ON "public"."knowledge_suggestions" 
  FOR DELETE TO "service_role" 
  USING (true);

COMMIT;
