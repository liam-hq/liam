BEGIN;

ALTER TABLE "public"."migrations" ADD COLUMN "organization_id" UUID;

UPDATE "public"."migrations" m
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."projects" p
  WHERE p."id" = m."project_id"
  LIMIT 1
);

ALTER TABLE "public"."migrations" 
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "public"."migrations" 
  ADD CONSTRAINT "migrations_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION "public"."set_migrations_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_migrations_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."migrations"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_migrations_organization_id"();

ALTER TABLE "public"."migrations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_migrations" 
  ON "public"."migrations" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_migrations" 
  ON "public"."migrations" 
  IS 'Authenticated users can only view migrations belonging to organizations they are members of';

CREATE POLICY "service_role_can_select_all_migrations" 
  ON "public"."migrations" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_migrations" 
  ON "public"."migrations" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_migrations" 
  ON "public"."migrations" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

COMMIT;
