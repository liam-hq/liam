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
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "path" "text" NOT NULL,
    "is_review_enabled" boolean DEFAULT true NOT NULL,
    "project_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."github_doc_file_paths" OWNER TO "postgres";









CREATE TABLE IF NOT EXISTS "public"."github_schema_file_paths" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "path" "text" NOT NULL,
    "project_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "format" "public"."schema_format_enum" NOT NULL
);


ALTER TABLE "public"."github_schema_file_paths" OWNER TO "postgres";









CREATE TABLE IF NOT EXISTS "public"."knowledge_suggestions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "type" "public"."knowledge_type" NOT NULL,
    "title" "text" NOT NULL,
    "path" "text" NOT NULL,
    "content" "text" NOT NULL,
    "file_sha" "text",
    "project_id" uuid NOT NULL,
    "approved_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "branch_name" "text" NOT NULL,
    "trace_id" "text",
    "reasoning" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."knowledge_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_suggestion_doc_mappings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "knowledge_suggestion_id" uuid NOT NULL,
    "github_doc_file_path_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."knowledge_suggestion_doc_mappings" OWNER TO "postgres";
















CREATE TABLE IF NOT EXISTS "public"."membership_invites" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email" "text" NOT NULL,
    "invite_by_user_id" "uuid" NOT NULL,
    "organization_id" uuid NOT NULL,
    "invited_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."membership_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migrations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" "text" NOT NULL,
    "pull_request_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."migrations" OWNER TO "postgres";









CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" "text" NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" "uuid" NOT NULL,
    "organization_id" uuid NOT NULL,
    "joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";




CREATE TABLE IF NOT EXISTS "public"."overall_reviews" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "project_id" uuid,
    "pull_request_id" uuid NOT NULL,
    "review_comment" "text",
    "reviewed_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "branch_name" "text" NOT NULL,
    "trace_id" "text"
);


ALTER TABLE "public"."overall_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overall_review_knowledge_suggestion_mappings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "overall_review_id" uuid NOT NULL,
    "knowledge_suggestion_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" OWNER TO "postgres";
















CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" uuid );


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_repository_mappings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "repository_id" uuid NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."project_repository_mappings" OWNER TO "postgres";
















CREATE TABLE IF NOT EXISTS "public"."pull_requests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "pull_number" bigint NOT NULL,
    "comment_id" bigint,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "repository_id" uuid NOT NULL
);


ALTER TABLE "public"."pull_requests" OWNER TO "postgres";









CREATE TABLE IF NOT EXISTS "public"."repositories" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" "text" NOT NULL,
    "owner" "text" NOT NULL,
    "installation_id" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."repositories" OWNER TO "postgres";









CREATE TABLE IF NOT EXISTS "public"."review_feedbacks" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "overall_review_id" uuid NOT NULL,
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






CREATE TABLE IF NOT EXISTS "public"."review_feedback_comments" (
    "id" uuid  DEFAULT gen_random_uuid(),
    "review_feedback_id" uuid NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL
);


ALTER TABLE "public"."review_feedback_comments" OWNER TO "postgres";













CREATE TABLE IF NOT EXISTS "public"."review_suggestion_snippets" (
    "id" uuid  DEFAULT gen_random_uuid(),
    "review_feedback_id" uuid NOT NULL,
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



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_path_project_id_key" UNIQUE ("path", "project_id");



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_invites"
    ADD CONSTRAINT "membership_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migration_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "pull_request_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repositories"
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



CREATE UNIQUE INDEX "github_schema_file_path_project_id_key" ON "public"."github_schema_file_paths" USING "btree" ("project_id");



CREATE UNIQUE INDEX "knowledge_suggestion_doc_mapping_unique_mapping" ON "public"."knowledge_suggestion_doc_mappings" USING "btree" ("knowledge_suggestion_id", "github_doc_file_path_id");



CREATE UNIQUE INDEX "migration_pull_request_id_key" ON "public"."migrations" USING "btree" ("pull_request_id");



CREATE UNIQUE INDEX "overall_review_knowledge_suggestion_mapping_unique_mapping" ON "public"."overall_review_knowledge_suggestion_mappings" USING "btree" ("overall_review_id", "knowledge_suggestion_id");



CREATE UNIQUE INDEX "project_repository_mapping_project_id_repository_id_key" ON "public"."project_repository_mappings" USING "btree" ("project_id", "repository_id");



CREATE UNIQUE INDEX "pull_request_repository_id_pull_number_key" ON "public"."pull_requests" USING "btree" ("repository_id", "pull_number");



CREATE UNIQUE INDEX "repository_owner_name_key" ON "public"."repositories" USING "btree" ("owner", "name");



CREATE INDEX "idx_project_organization_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_review_feedback_comment_review_feedback_id" ON "public"."review_feedback_comments" USING "btree" ("review_feedback_id");



CREATE INDEX "membership_invites_email_idx" ON "public"."membership_invites" USING "btree" ("email");



CREATE INDEX "membership_invites_org_id_idx" ON "public"."membership_invites" USING "btree" ("organization_id");



CREATE INDEX "organization_member_organization_id_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organization_member_user_id_idx" ON "public"."organization_members" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."github_doc_file_paths"
    ADD CONSTRAINT "github_doc_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_github_doc_file_path_id_fkey" FOREIGN KEY ("github_doc_file_path_id") REFERENCES "public"."github_doc_file_paths"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_knowledge_suggestion_id_fkey" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."membership_invites"
    ADD CONSTRAINT "membership_invites_invite_by_user_id_fkey" FOREIGN KEY ("invite_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_invites"
    ADD CONSTRAINT "membership_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migration_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_knowledge_suggestion_id_f" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_overall_review_id_fkey" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pull_requests"
    ADD CONSTRAINT "pull_request_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedbacks"
    ADD CONSTRAINT "review_feedback_overall_review_id_fkey" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_suggestion_snippets"
    ADD CONSTRAINT "review_suggestion_snippet_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


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



CREATE POLICY "service_role_can_delete_all_projects" ON "public"."projects" FOR DELETE TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_delete_all_projects" ON "public"."projects" IS 'Service role can delete any project (for jobs)';



CREATE POLICY "service_role_can_insert_all_projects" ON "public"."projects" FOR INSERT TO "service_role" WITH CHECK (true);



COMMENT ON POLICY "service_role_can_insert_all_projects" ON "public"."projects" IS 'Service role can create any project (for jobs)';



CREATE POLICY "service_role_can_select_all_projects" ON "public"."projects" FOR SELECT TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_select_all_projects" ON "public"."projects" IS 'Service role can view all projects (for jobs)';



CREATE POLICY "service_role_can_update_all_projects" ON "public"."projects" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_can_update_all_projects" ON "public"."projects" IS 'Service role can update any project (for jobs)';





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






GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."github_schema_file_paths" TO "service_role";






GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_suggestion_doc_mappings" TO "service_role";









GRANT ALL ON TABLE "public"."membership_invites" TO "anon";
GRANT ALL ON TABLE "public"."membership_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_invites" TO "service_role";






GRANT ALL ON TABLE "public"."migrations" TO "anon";
GRANT ALL ON TABLE "public"."migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."migrations" TO "service_role";






GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";









GRANT ALL ON TABLE "public"."overall_reviews" TO "anon";
GRANT ALL ON TABLE "public"."overall_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."overall_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "anon";
GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."overall_review_knowledge_suggestion_mappings" TO "service_role";









GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."project_repository_mappings" TO "anon";
GRANT ALL ON TABLE "public"."project_repository_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."project_repository_mappings" TO "service_role";









GRANT ALL ON TABLE "public"."pull_requests" TO "anon";
GRANT ALL ON TABLE "public"."pull_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."pull_requests" TO "service_role";






GRANT ALL ON TABLE "public"."repositories" TO "anon";
GRANT ALL ON TABLE "public"."repositories" TO "authenticated";
GRANT ALL ON TABLE "public"."repositories" TO "service_role";






GRANT ALL ON TABLE "public"."review_feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."review_feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedbacks" TO "service_role";






GRANT ALL ON TABLE "public"."review_feedback_comments" TO "anon";
GRANT ALL ON TABLE "public"."review_feedback_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."review_feedback_comments" TO "service_role";









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

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
