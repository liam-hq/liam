

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."category_enum" AS ENUM (
    'MIGRATION_SAFETY',
    'DATA_INTEGRITY',
    'PERFORMANCE_IMPACT',
    'PROJECT_RULES_CONSISTENCY',
    'SECURITY_OR_SCALABILITY'
);


ALTER TYPE "public"."category_enum" OWNER TO "postgres";


CREATE TYPE "public"."knowledge_type" AS ENUM (
    'SCHEMA',
    'DOCS'
);


ALTER TYPE "public"."knowledge_type" OWNER TO "postgres";


CREATE TYPE "public"."schema_format_enum" AS ENUM (
    'schemarb',
    'postgres',
    'prisma',
    'tbls'
);


ALTER TYPE "public"."schema_format_enum" OWNER TO "postgres";


CREATE TYPE "public"."severity_enum" AS ENUM (
    'CRITICAL',
    'WARNING',
    'POSITIVE',
    'QUESTION'
);


ALTER TYPE "public"."severity_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public."users" (id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_existing_users"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public."users" (id, name, email)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    au.email
  FROM auth.users au
  LEFT JOIN public."users" pu ON au.id = pu.id
  WHERE pu.id IS NULL;
END;
$$;


ALTER FUNCTION "public"."sync_existing_users"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."github_doc_file_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "is_review_enabled" boolean DEFAULT true NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."github_doc_file_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_pull_request_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "github_pull_request_id" "uuid" NOT NULL,
    "github_comment_identifier" bigint NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."github_pull_request_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_pull_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pull_number" bigint NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "repository_id" "uuid" NOT NULL
);


ALTER TABLE "public"."github_pull_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_repositories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner" "text" NOT NULL,
    "github_installation_identifier" integer NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "github_repository_identifier" integer NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."github_repositories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_schema_file_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "format" "public"."schema_format_enum" NOT NULL
);


ALTER TABLE "public"."github_schema_file_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "invite_by_user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_suggestion_doc_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_suggestion_id" "uuid" NOT NULL,
    "github_doc_file_path_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."knowledge_suggestion_doc_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."knowledge_type" NOT NULL,
    "title" "text" NOT NULL,
    "path" "text" NOT NULL,
    "content" "text" NOT NULL,
    "file_sha" "text",
    "project_id" "uuid" NOT NULL,
    "approved_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "branch_name" "text" NOT NULL,
    "trace_id" "text",
    "reasoning" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."knowledge_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migration_pull_request_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "migration_id" "uuid" NOT NULL,
    "pull_request_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."migration_pull_request_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "project_id" "uuid" NOT NULL
);


ALTER TABLE "public"."migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overall_review_knowledge_suggestion_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "overall_review_id" "uuid" NOT NULL,
    "knowledge_suggestion_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overall_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "pull_request_id" "uuid" NOT NULL,
    "review_comment" "text",
    "reviewed_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "branch_name" "text" NOT NULL,
    "trace_id" "text"
);


ALTER TABLE "public"."overall_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_repository_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "repository_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."project_repository_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_feedback_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."review_feedback_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_feedback_knowledge_suggestion_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid",
    "knowledge_suggestion_id" "uuid",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."review_feedback_knowledge_suggestion_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "overall_review_id" "uuid" NOT NULL,
    "category" "public"."category_enum" NOT NULL,
    "severity" "public"."severity_enum" NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "suggestion" "text" NOT NULL,
    "resolved_at" timestamp(3) with time zone,
    "resolution_comment" "text"
);


ALTER TABLE "public"."review_feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_suggestion_snippets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "snippet" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."review_suggestion_snippets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."github_doc_file_paths"
    ADD CONSTRAINT "github_doc_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_comment_identifier_key" UNIQUE ("github_comment_identifier");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_pull_request_id_key" UNIQUE ("github_pull_request_id");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repository_github_repository_identifier_organization_id_" UNIQUE ("github_repository_identifier", "organization_id");



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_path_project_id_key" UNIQUE ("path", "project_id");



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mapping_migration_id_pull_request_id_key" UNIQUE ("migration_id", "pull_request_id");



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_pull_requests"
    ADD CONSTRAINT "pull_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "repository_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_feedbacks"
    ADD CONSTRAINT "review_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_suggestion_snippets"
    ADD CONSTRAINT "review_suggestion_snippet_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "github_doc_file_path_path_project_id_key" ON "public"."github_doc_file_paths" USING "btree" ("path", "project_id");



CREATE UNIQUE INDEX "github_pull_request_repository_id_pull_number_key" ON "public"."github_pull_requests" USING "btree" ("repository_id", "pull_number");



CREATE UNIQUE INDEX "github_repository_owner_name_key" ON "public"."github_repositories" USING "btree" ("owner", "name");



CREATE UNIQUE INDEX "github_schema_file_path_project_id_key" ON "public"."github_schema_file_paths" USING "btree" ("project_id");



CREATE INDEX "idx_project_organization_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_review_feedback_comment_review_feedback_id" ON "public"."review_feedback_comments" USING "btree" ("review_feedback_id");



CREATE INDEX "invitations_email_idx" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "invitations_organization_id_idx" ON "public"."invitations" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "knowledge_suggestion_doc_mapping_unique_mapping" ON "public"."knowledge_suggestion_doc_mappings" USING "btree" ("knowledge_suggestion_id", "github_doc_file_path_id");



CREATE INDEX "organization_member_organization_id_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organization_member_user_id_idx" ON "public"."organization_members" USING "btree" ("user_id");



CREATE UNIQUE INDEX "overall_review_knowledge_suggestion_mapping_unique_mapping" ON "public"."overall_review_knowledge_suggestion_mappings" USING "btree" ("overall_review_id", "knowledge_suggestion_id");



CREATE UNIQUE INDEX "project_repository_mapping_project_id_repository_id_key" ON "public"."project_repository_mappings" USING "btree" ("project_id", "repository_id");



ALTER TABLE ONLY "public"."github_doc_file_paths"
    ADD CONSTRAINT "github_doc_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_pull_request_id_fkey" FOREIGN KEY ("github_pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."github_pull_requests"
    ADD CONSTRAINT "github_pull_request_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invite_by_user_id_fkey" FOREIGN KEY ("invite_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_github_doc_file_path_id_fkey" FOREIGN KEY ("github_doc_file_path_id") REFERENCES "public"."github_doc_file_paths"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_knowledge_suggestion_id_fkey" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mapping_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "public"."migrations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mapping_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_knowledge_suggestio" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_overall_review_id_f" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedback_knowledge_suggestion_mappings"
    ADD CONSTRAINT "review_feedback_knowledge_suggesti_knowledge_suggestion_id_fkey" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id");



ALTER TABLE ONLY "public"."review_feedback_knowledge_suggestion_mappings"
    ADD CONSTRAINT "review_feedback_knowledge_suggestion_ma_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id");



ALTER TABLE ONLY "public"."review_feedbacks"
    ADD CONSTRAINT "review_feedback_overall_review_id_fkey" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_suggestion_snippets"
    ADD CONSTRAINT "review_suggestion_snippet_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "authenticated_users_can_delete_org_projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_projects" ON "public"."projects" IS 'Authenticated users can only delete projects in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_projects" ON "public"."projects" IS 'Authenticated users can create any project';



CREATE POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" IS 'Authenticated users can only view projects belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_projects" ON "public"."projects" IS 'Authenticated users can only update projects in organizations they are members of';



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_delete_all_projects" ON "public"."projects" FOR DELETE TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_delete_all_projects" ON "public"."projects" IS 'Service role can delete any project (for jobs)';



CREATE POLICY "service_role_can_insert_all_projects" ON "public"."projects" FOR INSERT TO "service_role" WITH CHECK (true);



COMMENT ON POLICY "service_role_can_insert_all_projects" ON "public"."projects" IS 'Service role can create any project (for jobs)';



CREATE POLICY "service_role_can_select_all_projects" ON "public"."projects" FOR SELECT TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_select_all_projects" ON "public"."projects" IS 'Service role can view all projects (for jobs)';



CREATE POLICY "service_role_can_update_all_projects" ON "public"."projects" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_can_update_all_projects" ON "public"."projects" IS 'Service role can update any project (for jobs)';



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_same_organization_select_policy" ON "public"."users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."organization_members" "om1"
     JOIN "public"."organization_members" "om2" ON (("om1"."organization_id" = "om2"."organization_id")))
  WHERE (("om1"."user_id" = "users"."id") AND ("om2"."user_id" = "auth"."uid"())))) OR ("id" = "auth"."uid"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "service_role";


















GRANT ALL ON TABLE "public"."github_doc_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."github_doc_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."github_doc_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "anon";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "service_role";



GRANT ALL ON TABLE "public"."github_pull_requests" TO "anon";
GRANT ALL ON TABLE "public"."github_pull_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."github_pull_requests" TO "service_role";



GRANT ALL ON TABLE "public"."github_repositories" TO "anon";
GRANT ALL ON TABLE "public"."github_repositories" TO "authenticated";
GRANT ALL ON TABLE "public"."github_repositories" TO "service_role";



GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."migration_pull_request_mappings" TO "anon";
GRANT ALL ON TABLE "public"."migration_pull_request_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_pull_request_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."migrations" TO "anon";
GRANT ALL ON TABLE "public"."migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."migrations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "anon";
GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."overall_reviews" TO "anon";
GRANT ALL ON TABLE "public"."overall_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."overall_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."project_repository_mappings" TO "anon";
GRANT ALL ON TABLE "public"."project_repository_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."project_repository_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."review_feedback_comments" TO "anon";
GRANT ALL ON TABLE "public"."review_feedback_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedback_comments" TO "service_role";



GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "anon";
GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedback_knowledge_suggestion_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."review_feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."review_feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."review_suggestion_snippets" TO "anon";
GRANT ALL ON TABLE "public"."review_suggestion_snippets" TO "authenticated";
GRANT ALL ON TABLE "public"."review_suggestion_snippets" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
