BEGIN;

ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" ADD COLUMN "organization_id" UUID;

UPDATE "public"."overall_review_knowledge_suggestion_mappings" orkm
SET "organization_id" = (
  SELECT ks."organization_id"
  FROM "public"."knowledge_suggestions" ks
  WHERE ks."id" = orkm."knowledge_suggestion_id"
  LIMIT 1
);

ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" 
  ADD CONSTRAINT "overall_review_knowledge_suggestion_mappings_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."knowledge_suggestions" 
    WHERE "id" = NEW.knowledge_suggestion_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_overall_review_knowledge_suggestion_mappings_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."overall_review_knowledge_suggestion_mappings"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_id"();

ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_overall_review_knowledge_suggestion_mappings" 
  ON "public"."overall_review_knowledge_suggestion_mappings" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_overall_review_knowledge_suggestion_mappings" 
  ON "public"."overall_review_knowledge_suggestion_mappings" 
  IS 'Authenticated users can only view mappings belonging to organizations they are members of';

CREATE POLICY "service_role_can_insert_all_overall_review_knowledge_suggestion_mappings" 
  ON "public"."overall_review_knowledge_suggestion_mappings" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
