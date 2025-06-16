BEGIN;

ALTER TABLE "public"."overall_reviews" ADD COLUMN "organization_id" UUID;

UPDATE "public"."overall_reviews" ovr
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."migrations" m
  JOIN "public"."projects" p ON m."project_id" = p."id"
  WHERE m."id" = ovr."migration_id"
  LIMIT 1
);

ALTER TABLE "public"."overall_reviews" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."overall_reviews" 
  ADD CONSTRAINT "overall_reviews_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_overall_reviews_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT p."organization_id"
    FROM "public"."migrations" m
    JOIN "public"."projects" p ON m."project_id" = p."id"
    WHERE m."id" = NEW.migration_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_overall_reviews_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."overall_reviews"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_overall_reviews_organization_id"();

ALTER TABLE "public"."overall_reviews" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_overall_reviews" 
  ON "public"."overall_reviews" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_overall_reviews" 
  ON "public"."overall_reviews" 
  IS 'Authenticated users can only view overall reviews belonging to organizations they are members of';

CREATE POLICY "service_role_can_select_all_overall_reviews" 
  ON "public"."overall_reviews" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_overall_reviews" 
  ON "public"."overall_reviews" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

COMMIT;
