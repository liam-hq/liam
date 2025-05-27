begin;

-- Create db_engines table
CREATE TABLE IF NOT EXISTS "public"."db_engines" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "project_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create migration_files table
CREATE TABLE IF NOT EXISTS "public"."migration_files" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "applied_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add foreign key constraints
ALTER TABLE ONLY "public"."db_engines"
    ADD CONSTRAINT "db_engines_project_id_fkey" 
    FOREIGN KEY ("project_id") 
    REFERENCES "public"."projects"("id") 
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."db_engines"
    ADD CONSTRAINT "db_engines_organization_id_fkey" 
    FOREIGN KEY ("organization_id") 
    REFERENCES "public"."organizations"("id") 
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."migration_files"
    ADD CONSTRAINT "migration_files_project_id_fkey" 
    FOREIGN KEY ("project_id") 
    REFERENCES "public"."projects"("id") 
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."migration_files"
    ADD CONSTRAINT "migration_files_organization_id_fkey" 
    FOREIGN KEY ("organization_id") 
    REFERENCES "public"."organizations"("id") 
    ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add indexes for better performance
CREATE INDEX "idx_db_engines_project_id" ON "public"."db_engines" USING btree ("project_id");
CREATE INDEX "idx_db_engines_organization_id" ON "public"."db_engines" USING btree ("organization_id");
CREATE INDEX "idx_migration_files_project_id" ON "public"."migration_files" USING btree ("project_id");
CREATE INDEX "idx_migration_files_organization_id" ON "public"."migration_files" USING btree ("organization_id");
CREATE INDEX "idx_migration_files_hash" ON "public"."migration_files" USING btree ("hash");

-- Add UNIQUE index on (project_id, hash) to prevent duplicate migration entries for the same project and speed up lookups
CREATE UNIQUE INDEX "idx_migration_files_project_id_hash_unique" ON "public"."migration_files" USING btree ("project_id", "hash");

-- Create triggers to automatically set organization_id based on project_id
CREATE OR REPLACE FUNCTION "public"."set_db_engines_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_db_engines_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."db_engines"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_db_engines_organization_id"();

CREATE OR REPLACE FUNCTION "public"."set_migration_files_organization_id"() RETURNS "trigger"
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

CREATE TRIGGER "set_migration_files_organization_id_trigger"
  BEFORE INSERT OR UPDATE ON "public"."migration_files"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."set_migration_files_organization_id"();

-- Enable RLS for db_engines table
ALTER TABLE "public"."db_engines" ENABLE ROW LEVEL SECURITY;

-- Create policies for db_engines table
CREATE POLICY "authenticated_users_can_select_org_db_engines" 
  ON "public"."db_engines"
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_insert_org_db_engines" 
  ON "public"."db_engines"
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_update_org_db_engines" 
  ON "public"."db_engines"
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

CREATE POLICY "authenticated_users_can_delete_org_db_engines" 
  ON "public"."db_engines"
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "service_role_can_select_all_db_engines" 
  ON "public"."db_engines" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_db_engines" 
  ON "public"."db_engines" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_db_engines" 
  ON "public"."db_engines" 
  FOR UPDATE TO "service_role" 
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_db_engines" 
  ON "public"."db_engines" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Enable RLS for migration_files table
ALTER TABLE "public"."migration_files" ENABLE ROW LEVEL SECURITY;

-- Create policies for migration_files table
CREATE POLICY "authenticated_users_can_select_org_migration_files" 
  ON "public"."migration_files"
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_insert_org_migration_files" 
  ON "public"."migration_files"
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "authenticated_users_can_update_org_migration_files" 
  ON "public"."migration_files"
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

CREATE POLICY "authenticated_users_can_delete_org_migration_files" 
  ON "public"."migration_files"
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

CREATE POLICY "service_role_can_select_all_migration_files" 
  ON "public"."migration_files" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_migration_files" 
  ON "public"."migration_files" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_migration_files" 
  ON "public"."migration_files" 
  FOR UPDATE TO "service_role" 
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_migration_files" 
  ON "public"."migration_files" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Set table ownership
ALTER TABLE "public"."db_engines" OWNER TO "postgres";
ALTER TABLE "public"."migration_files" OWNER TO "postgres";

-- Grant permissions
GRANT ALL ON TABLE "public"."db_engines" TO "anon";
GRANT ALL ON TABLE "public"."db_engines" TO "authenticated";
GRANT ALL ON TABLE "public"."db_engines" TO "service_role";

GRANT ALL ON TABLE "public"."migration_files" TO "anon";
GRANT ALL ON TABLE "public"."migration_files" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_files" TO "service_role";

-- Grant sequence permissions for db_engines.id
GRANT ALL ON SEQUENCE "public"."db_engines_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."db_engines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."db_engines_id_seq" TO "service_role";

-- Grant function permissions
GRANT ALL ON FUNCTION "public"."set_db_engines_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_db_engines_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_db_engines_organization_id"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_migration_files_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_migration_files_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_migration_files_organization_id"() TO "service_role";

commit;
