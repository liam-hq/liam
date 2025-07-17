BEGIN;

-- Create workflow_run_status enum type
CREATE TYPE "public"."workflow_run_status" AS ENUM (
    'pending',
    'success',
    'error'
);

ALTER TYPE "public"."workflow_run_status" OWNER TO "postgres";

-- Create workflow_runs table to track LangGraph workflow executions
CREATE TABLE IF NOT EXISTS "public"."workflow_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "workflow_run_id" "uuid" NOT NULL,
    "status" "public"."workflow_run_status" DEFAULT 'pending' NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."workflow_runs" OWNER TO "postgres";

-- Add primary key constraint
ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add unique constraint on workflow_run_id
ALTER TABLE ONLY "public"."workflow_runs"
    ADD CONSTRAINT "workflow_runs_workflow_run_id_key" UNIQUE ("workflow_run_id");

-- Add index for better query performance
CREATE INDEX "workflow_runs_design_session_id_idx" ON "public"."workflow_runs" ("design_session_id");
CREATE INDEX "workflow_runs_organization_id_idx" ON "public"."workflow_runs" ("organization_id");

-- Create function to set organization_id from design_session
CREATE OR REPLACE FUNCTION "public"."set_workflow_runs_organization_id"() RETURNS "trigger"
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

ALTER FUNCTION "public"."set_workflow_runs_organization_id"() OWNER TO "postgres";

-- Create trigger to automatically set organization_id
CREATE TRIGGER "set_workflow_runs_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."workflow_runs"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_workflow_runs_organization_id"();

-- Create function to set updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."set_workflow_runs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_workflow_runs_updated_at"() OWNER TO "postgres";

-- Create trigger to automatically update updated_at
CREATE TRIGGER "set_workflow_runs_updated_at_trigger"
  BEFORE UPDATE ON "public"."workflow_runs"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_workflow_runs_updated_at"();

-- Enable Row Level Security
ALTER TABLE "public"."workflow_runs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "authenticated_users_can_select_org_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_workflow_runs" 
  ON "public"."workflow_runs" 
  IS 'Authenticated users can only view workflow runs belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_workflow_runs" 
  ON "public"."workflow_runs" 
  IS 'Authenticated users can only create workflow runs in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_workflow_runs" 
  ON "public"."workflow_runs" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_workflow_runs" 
  ON "public"."workflow_runs" 
  IS 'Authenticated users can only update workflow runs in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_workflow_runs" 
  ON "public"."workflow_runs" 
  IS 'Authenticated users can only delete workflow runs in organizations they are members of';

-- Create RLS policies for service role
CREATE POLICY "service_role_can_select_all_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_workflow_runs" 
  ON "public"."workflow_runs" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."workflow_runs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_runs" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_workflow_runs_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_workflow_runs_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_workflow_runs_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_workflow_runs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_workflow_runs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_workflow_runs_updated_at"() TO "service_role";

-- Enable realtime for workflow_runs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_runs;

COMMIT;