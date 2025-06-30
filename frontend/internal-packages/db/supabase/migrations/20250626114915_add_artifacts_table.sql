BEGIN;

CREATE TABLE IF NOT EXISTS "public"."artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "artifact" "jsonb",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."artifacts" OWNER TO "postgres";

ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id");

-- Add unique constraint to enforce 1:1 relationship with design_sessions
ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_design_session_id_unique" UNIQUE ("design_session_id");

ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Function to automatically set organization_id
CREATE OR REPLACE FUNCTION "public"."set_artifacts_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."design_sessions" 
    WHERE "id" = NEW.design_session_id
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_artifacts_organization_id"() OWNER TO "postgres";

CREATE TRIGGER "set_artifacts_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."artifacts"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_artifacts_organization_id"();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_artifacts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_artifacts_updated_at"() OWNER TO "postgres";

CREATE TRIGGER "update_artifacts_updated_at_trigger"
  BEFORE UPDATE ON "public"."artifacts"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_artifacts_updated_at"();

-- Enable RLS
ALTER TABLE "public"."artifacts" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "authenticated_users_can_select_org_artifacts" 
  ON "public"."artifacts" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_artifacts" 
  ON "public"."artifacts" 
  IS 'Authenticated users can only view artifacts belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_artifacts" 
  ON "public"."artifacts" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_artifacts" 
  ON "public"."artifacts" 
  IS 'Authenticated users can only create artifacts in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_artifacts" 
  ON "public"."artifacts" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_artifacts" 
  ON "public"."artifacts" 
  IS 'Authenticated users can only update artifacts in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_artifacts" 
  ON "public"."artifacts" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_artifacts" 
  ON "public"."artifacts" 
  IS 'Authenticated users can only delete artifacts in organizations they are members of';

-- RLS Policies for service_role
CREATE POLICY "service_role_can_select_all_artifacts" 
  ON "public"."artifacts" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_artifacts" 
  ON "public"."artifacts" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_artifacts" 
  ON "public"."artifacts" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_artifacts" 
  ON "public"."artifacts" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."artifacts" TO "anon";
GRANT ALL ON TABLE "public"."artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."artifacts" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "service_role";

-- Add artifacts table to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;

-- Create index for performance optimization (design_session_id search is the main pattern)
CREATE INDEX IF NOT EXISTS "idx_artifacts_design_session_created" 
ON "public"."artifacts" ("design_session_id", "created_at" DESC);

COMMIT;
