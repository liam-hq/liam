BEGIN;

ALTER TABLE "public"."review_feedbacks" ADD COLUMN "organization_id" UUID;

UPDATE "public"."review_feedbacks" rf
SET "organization_id" = (
  SELECT ovr."organization_id"
  FROM "public"."overall_reviews" ovr
  WHERE ovr."id" = rf."overall_review_id"
  LIMIT 1
);

ALTER TABLE "public"."review_feedbacks" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."review_feedbacks" 
  ADD CONSTRAINT "review_feedbacks_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_review_feedbacks_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."overall_reviews" 
    WHERE "id" = NEW.overall_review_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_review_feedbacks_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."review_feedbacks"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_review_feedbacks_organization_id"();

ALTER TABLE "public"."review_feedbacks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_review_feedbacks" 
  ON "public"."review_feedbacks" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_review_feedbacks" 
  ON "public"."review_feedbacks" 
  IS 'Authenticated users can only view review feedbacks belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_review_feedbacks" 
  ON "public"."review_feedbacks" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_review_feedbacks" 
  ON "public"."review_feedbacks" 
  IS 'Authenticated users can only update review feedbacks belonging to organizations they are members of';

CREATE POLICY "service_role_can_insert_all_review_feedbacks" 
  ON "public"."review_feedbacks" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
