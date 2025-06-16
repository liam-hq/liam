BEGIN;

ALTER TABLE "public"."review_feedback_comments" ADD COLUMN "organization_id" UUID;

UPDATE "public"."review_feedback_comments" rfc
SET "organization_id" = (
  SELECT rf."organization_id"
  FROM "public"."review_feedbacks" rf
  WHERE rf."id" = rfc."review_feedback_id"
  LIMIT 1
);

ALTER TABLE "public"."review_feedback_comments" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."review_feedback_comments" 
  ADD CONSTRAINT "review_feedback_comments_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_review_feedback_comments_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."review_feedbacks" 
    WHERE "id" = NEW.review_feedback_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_review_feedback_comments_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."review_feedback_comments"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_review_feedback_comments_organization_id"();

ALTER TABLE "public"."review_feedback_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_review_feedback_comments" 
  ON "public"."review_feedback_comments" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_review_feedback_comments" 
  ON "public"."review_feedback_comments" 
  IS 'Authenticated users can only view review feedback comments belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_review_feedback_comments" 
  ON "public"."review_feedback_comments" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_review_feedback_comments" 
  ON "public"."review_feedback_comments" 
  IS 'Authenticated users can only insert review feedback comments in organizations they are members of';

COMMIT;
