

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






CREATE TYPE "public"."CategoryEnum" AS ENUM (
    'MIGRATION_SAFETY',
    'DATA_INTEGRITY',
    'PERFORMANCE_IMPACT',
    'PROJECT_RULES_CONSISTENCY',
    'SECURITY_OR_SCALABILITY'
);


ALTER TYPE "public"."CategoryEnum" OWNER TO "postgres";


CREATE TYPE "public"."KnowledgeType" AS ENUM (
    'SCHEMA',
    'DOCS'
);


ALTER TYPE "public"."KnowledgeType" OWNER TO "postgres";


CREATE TYPE "public"."SeverityEnum" AS ENUM (
    'CRITICAL',
    'WARNING',
    'POSITIVE'
);


ALTER TYPE "public"."SeverityEnum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public."User" (id, name, email)
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
  INSERT INTO public."User" (id, name, email)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    au.email
  FROM auth.users au
  LEFT JOIN public."User" pu ON au.id = pu.id
  WHERE pu.id IS NULL;
END;
$$;


ALTER FUNCTION "public"."sync_existing_users"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."GitHubDocFilePath" (
    "id" integer NOT NULL,
    "path" "text" NOT NULL,
    "isReviewEnabled" boolean DEFAULT true NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."GitHubDocFilePath" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."GitHubDocFilePath_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."GitHubDocFilePath_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."GitHubDocFilePath_id_seq" OWNED BY "public"."GitHubDocFilePath"."id";



CREATE TABLE IF NOT EXISTS "public"."GitHubSchemaFilePath" (
    "id" integer NOT NULL,
    "path" "text" NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."GitHubSchemaFilePath" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."GitHubSchemaFilePath_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."GitHubSchemaFilePath_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."GitHubSchemaFilePath_id_seq" OWNED BY "public"."GitHubSchemaFilePath"."id";



CREATE TABLE IF NOT EXISTS "public"."KnowledgeSuggestion" (
    "id" integer NOT NULL,
    "type" "public"."KnowledgeType" NOT NULL,
    "title" "text" NOT NULL,
    "path" "text" NOT NULL,
    "content" "text" NOT NULL,
    "fileSha" "text",
    "projectId" integer NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" "text" NOT NULL,
    "traceId" "text",
    "reasoning" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."KnowledgeSuggestion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."KnowledgeSuggestionDocMapping" (
    "id" integer NOT NULL,
    "knowledgeSuggestionId" integer NOT NULL,
    "gitHubDocFilePathId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."KnowledgeSuggestionDocMapping" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."KnowledgeSuggestionDocMapping_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."KnowledgeSuggestionDocMapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."KnowledgeSuggestionDocMapping_id_seq" OWNED BY "public"."KnowledgeSuggestionDocMapping"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."KnowledgeSuggestion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."KnowledgeSuggestion_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."KnowledgeSuggestion_id_seq" OWNED BY "public"."KnowledgeSuggestion"."id";



CREATE TABLE IF NOT EXISTS "public"."MembershipInvites" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "inviteByUserId" "uuid" NOT NULL,
    "organizationId" integer NOT NULL,
    "invitedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."MembershipInvites" OWNER TO "postgres";


ALTER TABLE "public"."MembershipInvites" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."MembershipInvites_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Migration" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "pullRequestId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Migration" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Migration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."Migration_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Migration_id_seq" OWNED BY "public"."Migration"."id";



CREATE TABLE IF NOT EXISTS "public"."Organization" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."Organization" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OrganizationMember" (
    "id" integer NOT NULL,
    "userId" "uuid" NOT NULL,
    "organizationId" integer NOT NULL,
    "joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."OrganizationMember" OWNER TO "postgres";


ALTER TABLE "public"."OrganizationMember" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."OrganizationMember_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."Organization" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."Organization_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."OverallReview" (
    "id" integer NOT NULL,
    "projectId" integer,
    "pullRequestId" integer NOT NULL,
    "reviewComment" "text",
    "reviewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" "text" NOT NULL,
    "traceId" "text"
);


ALTER TABLE "public"."OverallReview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OverallReviewKnowledgeSuggestionMapping" (
    "id" integer NOT NULL,
    "overallReviewId" integer NOT NULL,
    "knowledgeSuggestionId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."OverallReviewKnowledgeSuggestionMapping" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."OverallReviewKnowledgeSuggestionMapping_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" OWNED BY "public"."OverallReviewKnowledgeSuggestionMapping"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."OverallReview_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."OverallReview_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."OverallReview_id_seq" OWNED BY "public"."OverallReview"."id";



CREATE TABLE IF NOT EXISTS "public"."Project" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "organizationId" integer
);


ALTER TABLE "public"."Project" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ProjectRepositoryMapping" (
    "id" integer NOT NULL,
    "projectId" integer NOT NULL,
    "repositoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ProjectRepositoryMapping" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ProjectRepositoryMapping_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ProjectRepositoryMapping_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ProjectRepositoryMapping_id_seq" OWNED BY "public"."ProjectRepositoryMapping"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Project_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."Project_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Project_id_seq" OWNED BY "public"."Project"."id";



CREATE TABLE IF NOT EXISTS "public"."PullRequest" (
    "id" integer NOT NULL,
    "pullNumber" bigint NOT NULL,
    "commentId" bigint,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "repositoryId" integer NOT NULL
);


ALTER TABLE "public"."PullRequest" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."PullRequest_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."PullRequest_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."PullRequest_id_seq" OWNED BY "public"."PullRequest"."id";



CREATE TABLE IF NOT EXISTS "public"."Repository" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "owner" "text" NOT NULL,
    "installationId" bigint NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Repository" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Repository_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."Repository_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Repository_id_seq" OWNED BY "public"."Repository"."id";



CREATE TABLE IF NOT EXISTS "public"."ReviewIssue" (
    "id" integer NOT NULL,
    "overallReviewId" integer NOT NULL,
    "category" "public"."CategoryEnum" NOT NULL,
    "severity" "public"."SeverityEnum" NOT NULL,
    "description" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "suggestion" "text" NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolutionComment" "text"
);


ALTER TABLE "public"."ReviewIssue" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ReviewIssue_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ReviewIssue_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ReviewIssue_id_seq" OWNED BY "public"."ReviewIssue"."id";



CREATE TABLE IF NOT EXISTS "public"."ReviewScore" (
    "id" integer NOT NULL,
    "overallReviewId" integer NOT NULL,
    "overallScore" integer NOT NULL,
    "category" "public"."CategoryEnum" NOT NULL,
    "reason" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ReviewScore" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ReviewScore_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ReviewScore_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ReviewScore_id_seq" OWNED BY "public"."ReviewScore"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."ReviewSuggestionSnippet_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ReviewSuggestionSnippet_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ReviewSuggestionSnippet" (
    "id" integer DEFAULT "nextval"('"public"."ReviewSuggestionSnippet_id_seq"'::"regclass") NOT NULL,
    "reviewIssueId" integer NOT NULL,
    "filename" "text" NOT NULL,
    "snippet" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ReviewSuggestionSnippet" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."GitHubDocFilePath" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."GitHubDocFilePath_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."GitHubSchemaFilePath" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."GitHubSchemaFilePath_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."KnowledgeSuggestion" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."KnowledgeSuggestion_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."KnowledgeSuggestionDocMapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."KnowledgeSuggestionDocMapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Migration" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Migration_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."OverallReview" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OverallReview_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."OverallReviewKnowledgeSuggestionMapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OverallReviewKnowledgeSuggestionMapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Project" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Project_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ProjectRepositoryMapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ProjectRepositoryMapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PullRequest" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PullRequest_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Repository" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Repository_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ReviewIssue" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ReviewIssue_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ReviewScore" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ReviewScore_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GitHubSchemaFilePath"
    ADD CONSTRAINT "GitHubSchemaFilePath_path_projectId_key" UNIQUE ("path", "projectId");



ALTER TABLE ONLY "public"."GitHubSchemaFilePath"
    ADD CONSTRAINT "GitHubSchemaFilePath_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."KnowledgeSuggestionDocMapping"
    ADD CONSTRAINT "KnowledgeSuggestionDocMapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MembershipInvites"
    ADD CONSTRAINT "MembershipInvites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Migration"
    ADD CONSTRAINT "Migration_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_organizationId_key" UNIQUE ("userId", "organizationId");



ALTER TABLE ONLY "public"."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OverallReviewKnowledgeSuggestionMapping"
    ADD CONSTRAINT "OverallReviewKnowledgeSuggestionMapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OverallReview"
    ADD CONSTRAINT "OverallReview_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PullRequest"
    ADD CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Repository"
    ADD CONSTRAINT "Repository_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReviewIssue"
    ADD CONSTRAINT "ReviewIssue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReviewScore"
    ADD CONSTRAINT "ReviewScore_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReviewSuggestionSnippet"
    ADD CONSTRAINT "ReviewSuggestionSnippet_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "GitHubDocFilePath_path_projectId_key" ON "public"."GitHubDocFilePath" USING "btree" ("path", "projectId");



CREATE UNIQUE INDEX "KnowledgeSuggestionDocMapping_unique_mapping" ON "public"."KnowledgeSuggestionDocMapping" USING "btree" ("knowledgeSuggestionId", "gitHubDocFilePathId");



CREATE UNIQUE INDEX "Migration_pullRequestId_key" ON "public"."Migration" USING "btree" ("pullRequestId");



CREATE UNIQUE INDEX "OverallReviewKnowledgeSuggestionMapping_unique_mapping" ON "public"."OverallReviewKnowledgeSuggestionMapping" USING "btree" ("overallReviewId", "knowledgeSuggestionId");



CREATE UNIQUE INDEX "ProjectRepositoryMapping_projectId_repositoryId_key" ON "public"."ProjectRepositoryMapping" USING "btree" ("projectId", "repositoryId");



CREATE UNIQUE INDEX "PullRequest_repositoryId_pullNumber_key" ON "public"."PullRequest" USING "btree" ("repositoryId", "pullNumber");



CREATE UNIQUE INDEX "Repository_owner_name_key" ON "public"."Repository" USING "btree" ("owner", "name");



CREATE INDEX "membership_invites_email_idx" ON "public"."MembershipInvites" USING "btree" ("email");



CREATE INDEX "membership_invites_orgId_idx" ON "public"."MembershipInvites" USING "btree" ("organizationId");



CREATE INDEX "organization_member_organizationId_idx" ON "public"."OrganizationMember" USING "btree" ("organizationId");



CREATE INDEX "organization_member_userId_idx" ON "public"."OrganizationMember" USING "btree" ("userId");



ALTER TABLE ONLY "public"."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."GitHubSchemaFilePath"
    ADD CONSTRAINT "GitHubSchemaFilePath_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."KnowledgeSuggestionDocMapping"
    ADD CONSTRAINT "KnowledgeSuggestionDocMapping_gitHubDocFilePathId_fkey" FOREIGN KEY ("gitHubDocFilePathId") REFERENCES "public"."GitHubDocFilePath"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."KnowledgeSuggestionDocMapping"
    ADD CONSTRAINT "KnowledgeSuggestionDocMapping_knowledgeSuggestionId_fkey" FOREIGN KEY ("knowledgeSuggestionId") REFERENCES "public"."KnowledgeSuggestion"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."MembershipInvites"
    ADD CONSTRAINT "MembershipInvites_inviteByUserId_fkey" FOREIGN KEY ("inviteByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."MembershipInvites"
    ADD CONSTRAINT "MembershipInvites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Migration"
    ADD CONSTRAINT "Migration_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "public"."PullRequest"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OverallReviewKnowledgeSuggestionMapping"
    ADD CONSTRAINT "OverallReviewKnowledgeSuggestionMapping_knowledgeSuggestionId_f" FOREIGN KEY ("knowledgeSuggestionId") REFERENCES "public"."KnowledgeSuggestion"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OverallReviewKnowledgeSuggestionMapping"
    ADD CONSTRAINT "OverallReviewKnowledgeSuggestionMapping_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "public"."OverallReview"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OverallReview"
    ADD CONSTRAINT "OverallReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."OverallReview"
    ADD CONSTRAINT "OverallReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "public"."PullRequest"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."PullRequest"
    ADD CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ReviewIssue"
    ADD CONSTRAINT "ReviewIssue_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "public"."OverallReview"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ReviewScore"
    ADD CONSTRAINT "ReviewScore_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "public"."OverallReview"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ReviewSuggestionSnippet"
    ADD CONSTRAINT "ReviewSuggestionSnippet_reviewIssueId_fkey" FOREIGN KEY ("reviewIssueId") REFERENCES "public"."ReviewIssue"("id") ON UPDATE CASCADE ON DELETE CASCADE;





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


















GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "anon";
GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "authenticated";
GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "service_role";



GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."GitHubSchemaFilePath" TO "anon";
GRANT ALL ON TABLE "public"."GitHubSchemaFilePath" TO "authenticated";
GRANT ALL ON TABLE "public"."GitHubSchemaFilePath" TO "service_role";



GRANT ALL ON SEQUENCE "public"."GitHubSchemaFilePath_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."GitHubSchemaFilePath_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."GitHubSchemaFilePath_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "anon";
GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "authenticated";
GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "service_role";



GRANT ALL ON TABLE "public"."KnowledgeSuggestionDocMapping" TO "anon";
GRANT ALL ON TABLE "public"."KnowledgeSuggestionDocMapping" TO "authenticated";
GRANT ALL ON TABLE "public"."KnowledgeSuggestionDocMapping" TO "service_role";



GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestionDocMapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestionDocMapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestionDocMapping_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."MembershipInvites" TO "anon";
GRANT ALL ON TABLE "public"."MembershipInvites" TO "authenticated";
GRANT ALL ON TABLE "public"."MembershipInvites" TO "service_role";



GRANT ALL ON SEQUENCE "public"."MembershipInvites_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."MembershipInvites_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."MembershipInvites_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Migration" TO "anon";
GRANT ALL ON TABLE "public"."Migration" TO "authenticated";
GRANT ALL ON TABLE "public"."Migration" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Organization" TO "anon";
GRANT ALL ON TABLE "public"."Organization" TO "authenticated";
GRANT ALL ON TABLE "public"."Organization" TO "service_role";



GRANT ALL ON TABLE "public"."OrganizationMember" TO "anon";
GRANT ALL ON TABLE "public"."OrganizationMember" TO "authenticated";
GRANT ALL ON TABLE "public"."OrganizationMember" TO "service_role";



GRANT ALL ON SEQUENCE "public"."OrganizationMember_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OrganizationMember_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OrganizationMember_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Organization_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Organization_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Organization_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."OverallReview" TO "anon";
GRANT ALL ON TABLE "public"."OverallReview" TO "authenticated";
GRANT ALL ON TABLE "public"."OverallReview" TO "service_role";



GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "anon";
GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "authenticated";
GRANT ALL ON TABLE "public"."OverallReviewKnowledgeSuggestionMapping" TO "service_role";



GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OverallReviewKnowledgeSuggestionMapping_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."OverallReview_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OverallReview_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OverallReview_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Project" TO "anon";
GRANT ALL ON TABLE "public"."Project" TO "authenticated";
GRANT ALL ON TABLE "public"."Project" TO "service_role";



GRANT ALL ON TABLE "public"."ProjectRepositoryMapping" TO "anon";
GRANT ALL ON TABLE "public"."ProjectRepositoryMapping" TO "authenticated";
GRANT ALL ON TABLE "public"."ProjectRepositoryMapping" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ProjectRepositoryMapping_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ProjectRepositoryMapping_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ProjectRepositoryMapping_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Project_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Project_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Project_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."PullRequest" TO "anon";
GRANT ALL ON TABLE "public"."PullRequest" TO "authenticated";
GRANT ALL ON TABLE "public"."PullRequest" TO "service_role";



GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Repository" TO "anon";
GRANT ALL ON TABLE "public"."Repository" TO "authenticated";
GRANT ALL ON TABLE "public"."Repository" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ReviewIssue" TO "anon";
GRANT ALL ON TABLE "public"."ReviewIssue" TO "authenticated";
GRANT ALL ON TABLE "public"."ReviewIssue" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ReviewIssue_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ReviewIssue_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ReviewIssue_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ReviewScore" TO "anon";
GRANT ALL ON TABLE "public"."ReviewScore" TO "authenticated";
GRANT ALL ON TABLE "public"."ReviewScore" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ReviewScore_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ReviewScore_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ReviewScore_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ReviewSuggestionSnippet_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ReviewSuggestionSnippet_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ReviewSuggestionSnippet_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ReviewSuggestionSnippet" TO "anon";
GRANT ALL ON TABLE "public"."ReviewSuggestionSnippet" TO "authenticated";
GRANT ALL ON TABLE "public"."ReviewSuggestionSnippet" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";









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
