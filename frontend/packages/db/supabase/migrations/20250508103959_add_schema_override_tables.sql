CREATE TABLE IF NOT EXISTS "public"."schema_override_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "description" "text",
    "priority" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."schema_override_sources" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."table_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "tables" "text"[] NOT NULL,
    "comment" "text",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."table_groups" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."table_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."table_overrides" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."branch_schema_override_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "repository_id" "uuid" NOT NULL,
    "branch_or_commit" "text" NOT NULL,
    "schema_override_source_id" "uuid",
    "table_group_id" "uuid",
    "table_override_id" "uuid",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."branch_schema_override_mappings" OWNER TO "postgres";

ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "schema_override_sources_project_id_path_key" ON "public"."schema_override_sources" USING "btree" ("project_id", "path");
CREATE UNIQUE INDEX "table_groups_project_id_name_key" ON "public"."table_groups" USING "btree" ("project_id", "name");
CREATE UNIQUE INDEX "table_overrides_project_id_table_name_key" ON "public"."table_overrides" USING "btree" ("project_id", "table_name");
CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_source" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "schema_override_source_id") WHERE "schema_override_source_id" IS NOT NULL;
CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_group" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "table_group_id") WHERE "table_group_id" IS NOT NULL;
CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_override" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "table_override_id") WHERE "table_override_id" IS NOT NULL;

ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_schema_override_source_id_fkey" FOREIGN KEY ("schema_override_source_id") REFERENCES "public"."schema_override_sources"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_table_group_id_fkey" FOREIGN KEY ("table_group_id") REFERENCES "public"."table_groups"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_table_override_id_fkey" FOREIGN KEY ("table_override_id") REFERENCES "public"."table_overrides"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."schema_override_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."table_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."table_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."branch_schema_override_mappings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_can_select_org_schema_override_sources" ON "public"."schema_override_sources" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_insert_org_schema_override_sources" ON "public"."schema_override_sources" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_update_org_schema_override_sources" ON "public"."schema_override_sources" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "service_role_can_select_all_schema_override_sources" ON "public"."schema_override_sources" FOR SELECT TO "service_role" USING (true);
CREATE POLICY "service_role_can_insert_all_schema_override_sources" ON "public"."schema_override_sources" FOR INSERT TO "service_role" WITH CHECK (true);

CREATE POLICY "authenticated_users_can_select_org_table_groups" ON "public"."table_groups" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_insert_org_table_groups" ON "public"."table_groups" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_update_org_table_groups" ON "public"."table_groups" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "service_role_can_select_all_table_groups" ON "public"."table_groups" FOR SELECT TO "service_role" USING (true);
CREATE POLICY "service_role_can_insert_all_table_groups" ON "public"."table_groups" FOR INSERT TO "service_role" WITH CHECK (true);

CREATE POLICY "authenticated_users_can_select_org_table_overrides" ON "public"."table_overrides" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_insert_org_table_overrides" ON "public"."table_overrides" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_update_org_table_overrides" ON "public"."table_overrides" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "service_role_can_select_all_table_overrides" ON "public"."table_overrides" FOR SELECT TO "service_role" USING (true);
CREATE POLICY "service_role_can_insert_all_table_overrides" ON "public"."table_overrides" FOR INSERT TO "service_role" WITH CHECK (true);

CREATE POLICY "authenticated_users_can_select_org_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_insert_org_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "authenticated_users_can_update_org_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "service_role_can_select_all_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR SELECT TO "service_role" USING (true);
CREATE POLICY "service_role_can_insert_all_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR INSERT TO "service_role" WITH CHECK (true);

CREATE OR REPLACE FUNCTION "public"."set_schema_override_sources_organization_id"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "set_schema_override_sources_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."schema_override_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_schema_override_sources_organization_id"();

CREATE OR REPLACE FUNCTION "public"."set_table_groups_organization_id"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "set_table_groups_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."table_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_table_groups_organization_id"();

CREATE OR REPLACE FUNCTION "public"."set_table_overrides_organization_id"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "set_table_overrides_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."table_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."set_table_overrides_organization_id"();

CREATE OR REPLACE FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM github_repositories WHERE id = NEW.repository_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "set_branch_schema_override_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."branch_schema_override_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_branch_schema_override_mappings_organization_id"();
