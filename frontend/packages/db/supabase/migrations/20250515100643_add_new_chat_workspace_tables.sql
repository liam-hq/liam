
BEGIN;

CREATE TABLE IF NOT EXISTS "public"."design_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "parent_design_session_id" "uuid",
    "name" "text" NOT NULL,
    "git_sha" "text",
    "initial_schema_snapshot" "jsonb",
    "schema_file_path" "text",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."design_sessions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."messages" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."building_schemas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "schema" "jsonb" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."building_schemas" OWNER TO "postgres";

ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_parent_design_session_id_fkey" FOREIGN KEY ("parent_design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


CREATE OR REPLACE FUNCTION "public"."set_design_sessions_organization_id"() RETURNS "trigger"
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

ALTER FUNCTION "public"."set_design_sessions_organization_id"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_messages_organization_id"() RETURNS "trigger"
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

ALTER FUNCTION "public"."set_messages_organization_id"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_building_schemas_organization_id"() RETURNS "trigger"
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

ALTER FUNCTION "public"."set_building_schemas_organization_id"() OWNER TO "postgres";

CREATE TRIGGER "set_design_sessions_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."design_sessions"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_design_sessions_organization_id"();

CREATE TRIGGER "set_messages_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."messages"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_messages_organization_id"();

CREATE TRIGGER "set_building_schemas_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."building_schemas"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_building_schemas_organization_id"();

ALTER TABLE "public"."design_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."building_schemas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_design_sessions" 
  ON "public"."design_sessions" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_design_sessions" 
  ON "public"."design_sessions" 
  IS 'Authenticated users can only view design sessions belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_design_sessions" 
  ON "public"."design_sessions" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_design_sessions" 
  ON "public"."design_sessions" 
  IS 'Authenticated users can only create design sessions in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_design_sessions" 
  ON "public"."design_sessions" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_design_sessions" 
  ON "public"."design_sessions" 
  IS 'Authenticated users can only update design sessions in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_design_sessions" 
  ON "public"."design_sessions" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_design_sessions" 
  ON "public"."design_sessions" 
  IS 'Authenticated users can only delete design sessions in organizations they are members of';

CREATE POLICY "authenticated_users_can_select_org_messages" 
  ON "public"."messages" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_messages" 
  ON "public"."messages" 
  IS 'Authenticated users can only view messages belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_messages" 
  ON "public"."messages" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_messages" 
  ON "public"."messages" 
  IS 'Authenticated users can only create messages in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_messages" 
  ON "public"."messages" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_messages" 
  ON "public"."messages" 
  IS 'Authenticated users can only update messages in organizations they are members of';

CREATE POLICY "authenticated_users_can_select_org_building_schemas" 
  ON "public"."building_schemas" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_building_schemas" 
  ON "public"."building_schemas" 
  IS 'Authenticated users can only view building schemas belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_building_schemas" 
  ON "public"."building_schemas" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_building_schemas" 
  ON "public"."building_schemas" 
  IS 'Authenticated users can only create building schemas in organizations they are members of';

CREATE POLICY "service_role_can_select_all_design_sessions" 
  ON "public"."design_sessions" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_design_sessions" 
  ON "public"."design_sessions" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_design_sessions" 
  ON "public"."design_sessions" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_select_all_messages" 
  ON "public"."messages" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_messages" 
  ON "public"."messages" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_messages" 
  ON "public"."messages" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_select_all_building_schemas" 
  ON "public"."building_schemas" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "authenticated_users_can_update_org_building_schemas" 
  ON "public"."building_schemas" 
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

COMMENT ON POLICY "authenticated_users_can_update_org_building_schemas" 
  ON "public"."building_schemas" 
  IS 'Authenticated users can only update building schemas in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_building_schemas" 
  ON "public"."building_schemas" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_building_schemas" 
  ON "public"."building_schemas" 
  IS 'Authenticated users can only delete building schemas in organizations they are members of';

CREATE POLICY "service_role_can_insert_all_building_schemas" 
  ON "public"."building_schemas" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_building_schemas" 
  ON "public"."building_schemas" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_building_schemas" 
  ON "public"."building_schemas" 
  FOR DELETE TO "service_role" 
  USING (true);

GRANT ALL ON TABLE "public"."design_sessions" TO "anon";
GRANT ALL ON TABLE "public"."design_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."design_sessions" TO "service_role";

GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";

GRANT ALL ON TABLE "public"."building_schemas" TO "anon";
GRANT ALL ON TABLE "public"."building_schemas" TO "authenticated";
GRANT ALL ON TABLE "public"."building_schemas" TO "service_role";

GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_messages_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_messages_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_messages_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "service_role";

COMMIT;
