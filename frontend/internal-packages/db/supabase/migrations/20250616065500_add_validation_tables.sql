BEGIN;

-- Create validation_queries table
CREATE TABLE IF NOT EXISTS "public"."validation_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "query_string" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."validation_queries" OWNER TO "postgres";

-- Create validation_results table
CREATE TABLE IF NOT EXISTS "public"."validation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "validation_query_id" "uuid" NOT NULL,
    "result_set" "text",
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "validation_results_status_check" CHECK (("status" IN ('success', 'failure')))
);

ALTER TABLE "public"."validation_results" OWNER TO "postgres";

-- Add primary key constraints
ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_validation_query_id_fkey" FOREIGN KEY ("validation_query_id") REFERENCES "public"."validation_queries"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "validation_queries_design_session_id_idx" ON "public"."validation_queries"("design_session_id");
CREATE INDEX IF NOT EXISTS "validation_queries_organization_id_idx" ON "public"."validation_queries"("organization_id");
CREATE INDEX IF NOT EXISTS "validation_results_validation_query_id_idx" ON "public"."validation_results"("validation_query_id");
CREATE INDEX IF NOT EXISTS "validation_results_organization_id_idx" ON "public"."validation_results"("organization_id");
CREATE INDEX IF NOT EXISTS "validation_results_executed_at_idx" ON "public"."validation_results"("executed_at");

-- Create trigger functions to auto-populate organization_id
CREATE OR REPLACE FUNCTION "public"."set_validation_queries_organization_id"() RETURNS "trigger"
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

ALTER FUNCTION "public"."set_validation_queries_organization_id"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_validation_results_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."validation_queries" 
    WHERE "id" = NEW.validation_query_id
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_validation_results_organization_id"() OWNER TO "postgres";

-- Create triggers
CREATE TRIGGER "set_validation_queries_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."validation_queries"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_validation_queries_organization_id"();

CREATE TRIGGER "set_validation_results_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."validation_results"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_validation_results_organization_id"();

-- Enable Row Level Security
ALTER TABLE "public"."validation_queries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."validation_results" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for validation_queries
CREATE POLICY "authenticated_users_can_select_org_validation_queries" 
  ON "public"."validation_queries" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_validation_queries" 
  ON "public"."validation_queries" 
  IS 'Authenticated users can only view validation queries belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_validation_queries" 
  ON "public"."validation_queries" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_validation_queries" 
  ON "public"."validation_queries" 
  IS 'Authenticated users can only create validation queries in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_validation_queries" 
  ON "public"."validation_queries" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_validation_queries" 
  ON "public"."validation_queries" 
  IS 'Authenticated users can only update validation queries in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_validation_queries" 
  ON "public"."validation_queries" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_validation_queries" 
  ON "public"."validation_queries" 
  IS 'Authenticated users can only delete validation queries in organizations they are members of';

-- RLS Policies for validation_results
CREATE POLICY "authenticated_users_can_select_org_validation_results" 
  ON "public"."validation_results" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_validation_results" 
  ON "public"."validation_results" 
  IS 'Authenticated users can only view validation results belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_validation_results" 
  ON "public"."validation_results" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_validation_results" 
  ON "public"."validation_results" 
  IS 'Authenticated users can only create validation results in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_validation_results" 
  ON "public"."validation_results" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_validation_results" 
  ON "public"."validation_results" 
  IS 'Authenticated users can only update validation results in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_validation_results" 
  ON "public"."validation_results" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_validation_results" 
  ON "public"."validation_results" 
  IS 'Authenticated users can only delete validation results in organizations they are members of';

-- Service role policies for validation_queries
CREATE POLICY "service_role_can_select_all_validation_queries" 
  ON "public"."validation_queries" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_validation_queries" 
  ON "public"."validation_queries" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_validation_queries" 
  ON "public"."validation_queries" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_validation_queries" 
  ON "public"."validation_queries" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Service role policies for validation_results
CREATE POLICY "service_role_can_select_all_validation_results" 
  ON "public"."validation_results" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_validation_results" 
  ON "public"."validation_results" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_validation_results" 
  ON "public"."validation_results" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_validation_results" 
  ON "public"."validation_results" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."validation_queries" TO "anon";
GRANT ALL ON TABLE "public"."validation_queries" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_queries" TO "service_role";

GRANT ALL ON TABLE "public"."validation_results" TO "anon";
GRANT ALL ON TABLE "public"."validation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_results" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "service_role";

COMMIT;
