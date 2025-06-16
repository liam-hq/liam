BEGIN;

ALTER TABLE "public"."review_suggestion_snippets" ADD COLUMN "organization_id" UUID;

UPDATE "public"."review_suggestion_snippets" rss
SET "organization_id" = (
  SELECT rf."organization_id"
  FROM "public"."review_feedbacks" rf
  WHERE rf."id" = rss."review_feedback_id"
  LIMIT 1
);

ALTER TABLE "public"."review_suggestion_snippets" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."review_suggestion_snippets" 
  ADD CONSTRAINT "review_suggestion_snippets_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_review_suggestion_snippets_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_review_suggestion_snippets_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."review_suggestion_snippets"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_review_suggestion_snippets_organization_id"();

ALTER TABLE "public"."review_suggestion_snippets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_review_suggestion_snippets" 
  ON "public"."review_suggestion_snippets" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_review_suggestion_snippets" 
  ON "public"."review_suggestion_snippets" 
  IS 'Authenticated users can only view review suggestion snippets belonging to organizations they are members of';

CREATE POLICY "service_role_can_insert_all_review_suggestion_snippets" 
  ON "public"."review_suggestion_snippets" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
