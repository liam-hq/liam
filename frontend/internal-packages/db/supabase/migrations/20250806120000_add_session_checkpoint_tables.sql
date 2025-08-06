BEGIN;

-- Create session_checkpoints table
CREATE TABLE IF NOT EXISTS "public"."session_checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT '' NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "parent_checkpoint_id" "text",
    "checkpoint" "jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}' NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."session_checkpoints" OWNER TO "postgres";

-- Create unique constraint for LangGraph checkpoint identification
ALTER TABLE ONLY "public"."session_checkpoints"
    ADD CONSTRAINT "session_checkpoints_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."session_checkpoints"
    ADD CONSTRAINT "session_checkpoints_thread_ns_checkpoint_unique" 
    UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id");

-- Foreign key to organizations table
ALTER TABLE ONLY "public"."session_checkpoints"
    ADD CONSTRAINT "session_checkpoints_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create session_checkpoint_blobs table
CREATE TABLE IF NOT EXISTS "public"."session_checkpoint_blobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT '' NOT NULL,
    "channel" "text" NOT NULL,
    "version" "text" NOT NULL,
    "type" "text" NOT NULL,
    "blob" "bytea",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."session_checkpoint_blobs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."session_checkpoint_blobs"
    ADD CONSTRAINT "session_checkpoint_blobs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."session_checkpoint_blobs"
    ADD CONSTRAINT "session_checkpoint_blobs_unique" 
    UNIQUE ("thread_id", "checkpoint_ns", "channel", "version");

-- Foreign key to organizations table
ALTER TABLE ONLY "public"."session_checkpoint_blobs"
    ADD CONSTRAINT "session_checkpoint_blobs_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create session_checkpoint_writes table
CREATE TABLE IF NOT EXISTS "public"."session_checkpoint_writes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT '' NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "task_id" "text" NOT NULL,
    "idx" "int4" NOT NULL,
    "channel" "text" NOT NULL,
    "type" "text",
    "blob" "bytea" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."session_checkpoint_writes" OWNER TO "postgres";

ALTER TABLE ONLY "public"."session_checkpoint_writes"
    ADD CONSTRAINT "session_checkpoint_writes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."session_checkpoint_writes"
    ADD CONSTRAINT "session_checkpoint_writes_unique" 
    UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx");

-- Foreign key to organizations table
ALTER TABLE ONLY "public"."session_checkpoint_writes"
    ADD CONSTRAINT "session_checkpoint_writes_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Function to automatically update updated_at timestamp for session_checkpoints
CREATE OR REPLACE FUNCTION "public"."update_session_checkpoints_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_session_checkpoints_updated_at"() OWNER TO "postgres";

CREATE TRIGGER "update_session_checkpoints_updated_at_trigger"
  BEFORE UPDATE ON "public"."session_checkpoints"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_session_checkpoints_updated_at"();

-- Function to automatically update updated_at timestamp for session_checkpoint_blobs
CREATE OR REPLACE FUNCTION "public"."update_session_checkpoint_blobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_session_checkpoint_blobs_updated_at"() OWNER TO "postgres";

CREATE TRIGGER "update_session_checkpoint_blobs_updated_at_trigger"
  BEFORE UPDATE ON "public"."session_checkpoint_blobs"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_session_checkpoint_blobs_updated_at"();

-- Function to automatically update updated_at timestamp for session_checkpoint_writes
CREATE OR REPLACE FUNCTION "public"."update_session_checkpoint_writes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_session_checkpoint_writes_updated_at"() OWNER TO "postgres";

CREATE TRIGGER "update_session_checkpoint_writes_updated_at_trigger"
  BEFORE UPDATE ON "public"."session_checkpoint_writes"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_session_checkpoint_writes_updated_at"();

-- Enable RLS for session_checkpoints
ALTER TABLE "public"."session_checkpoints" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_checkpoints - authenticated users
CREATE POLICY "authenticated_users_can_select_org_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_insert_org_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_update_org_session_checkpoints" 
  ON "public"."session_checkpoints" 
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

CREATE POLICY "authenticated_users_can_delete_org_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

-- RLS Policies for session_checkpoints - service_role
CREATE POLICY "service_role_can_select_all_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_session_checkpoints" 
  ON "public"."session_checkpoints" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Enable RLS for session_checkpoint_blobs
ALTER TABLE "public"."session_checkpoint_blobs" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_checkpoint_blobs - authenticated users
CREATE POLICY "authenticated_users_can_select_org_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_insert_org_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_update_org_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
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

CREATE POLICY "authenticated_users_can_delete_org_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

-- RLS Policies for session_checkpoint_blobs - service_role
CREATE POLICY "service_role_can_select_all_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_session_checkpoint_blobs" 
  ON "public"."session_checkpoint_blobs" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Enable RLS for session_checkpoint_writes
ALTER TABLE "public"."session_checkpoint_writes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_checkpoint_writes - authenticated users
CREATE POLICY "authenticated_users_can_select_org_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_insert_org_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_update_org_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
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

CREATE POLICY "authenticated_users_can_delete_org_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

-- RLS Policies for session_checkpoint_writes - service_role
CREATE POLICY "service_role_can_select_all_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_session_checkpoint_writes" 
  ON "public"."session_checkpoint_writes" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions for all tables
GRANT ALL ON TABLE "public"."session_checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."session_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."session_checkpoints" TO "service_role";

GRANT ALL ON TABLE "public"."session_checkpoint_blobs" TO "anon";
GRANT ALL ON TABLE "public"."session_checkpoint_blobs" TO "authenticated";
GRANT ALL ON TABLE "public"."session_checkpoint_blobs" TO "service_role";

GRANT ALL ON TABLE "public"."session_checkpoint_writes" TO "anon";
GRANT ALL ON TABLE "public"."session_checkpoint_writes" TO "authenticated";
GRANT ALL ON TABLE "public"."session_checkpoint_writes" TO "service_role";

-- Grant permissions for functions
GRANT ALL ON FUNCTION "public"."update_session_checkpoints_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_checkpoints_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_checkpoints_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_session_checkpoint_blobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_checkpoint_blobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_checkpoint_blobs_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_session_checkpoint_writes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_checkpoint_writes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_checkpoint_writes_updated_at"() TO "service_role";

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS "idx_session_checkpoints_thread_created" 
ON "public"."session_checkpoints" ("thread_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_session_checkpoints_org_thread" 
ON "public"."session_checkpoints" ("organization_id", "thread_id");

CREATE INDEX IF NOT EXISTS "idx_session_checkpoint_blobs_thread_channel" 
ON "public"."session_checkpoint_blobs" ("thread_id", "checkpoint_ns", "channel");

CREATE INDEX IF NOT EXISTS "idx_session_checkpoint_writes_checkpoint" 
ON "public"."session_checkpoint_writes" ("thread_id", "checkpoint_ns", "checkpoint_id");

COMMIT;