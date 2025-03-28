

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






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."KnowledgeType" AS ENUM (
    'SCHEMA',
    'DOCS'
);


ALTER TYPE "public"."KnowledgeType" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Doc" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "latestVersionId" integer,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Doc" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."DocVersion" (
    "id" integer NOT NULL,
    "docId" integer NOT NULL,
    "version" integer NOT NULL,
    "content" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "title" "text" NOT NULL
);


ALTER TABLE "public"."DocVersion" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."DocVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."DocVersion_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."DocVersion_id_seq" OWNED BY "public"."DocVersion"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."Doc_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."Doc_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Doc_id_seq" OWNED BY "public"."Doc"."id";



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



CREATE TABLE IF NOT EXISTS "public"."KnowledgeSuggestion" (
    "id" integer NOT NULL,
    "type" "public"."KnowledgeType" NOT NULL,
    "title" "text" NOT NULL,
    "path" "text" NOT NULL,
    "content" "text" NOT NULL,
    "fileSha" "text" NOT NULL,
    "projectId" integer NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" text NOT NULL
);


ALTER TABLE "public"."KnowledgeSuggestion" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."KnowledgeSuggestion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."KnowledgeSuggestion_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."KnowledgeSuggestion_id_seq" OWNED BY "public"."KnowledgeSuggestion"."id";



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



CREATE TABLE IF NOT EXISTS "public"."OverallReview" (
    "id" integer NOT NULL,
    "projectId" integer,
    "pullRequestId" integer NOT NULL,
    "reviewComment" "text",
    "reviewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" "text" NOT NULL
);


ALTER TABLE "public"."OverallReview" OWNER TO "postgres";


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
    "updatedAt" timestamp(3) without time zone NOT NULL
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



CREATE TABLE IF NOT EXISTS "public"."WatchSchemaFilePattern" (
    "id" integer NOT NULL,
    "pattern" "text" NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."WatchSchemaFilePattern" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."WatchSchemaFilePattern_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."WatchSchemaFilePattern_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."WatchSchemaFilePattern_id_seq" OWNED BY "public"."WatchSchemaFilePattern"."id";



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


ALTER TABLE ONLY "public"."Doc" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Doc_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."DocVersion" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."DocVersion_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."GitHubDocFilePath" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."GitHubDocFilePath_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."KnowledgeSuggestion" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."KnowledgeSuggestion_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Migration" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Migration_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."OverallReview" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OverallReview_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Project" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Project_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ProjectRepositoryMapping" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ProjectRepositoryMapping_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PullRequest" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PullRequest_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Repository" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Repository_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."WatchSchemaFilePattern" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."WatchSchemaFilePattern_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."DocVersion"
    ADD CONSTRAINT "DocVersion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Doc"
    ADD CONSTRAINT "Doc_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Migration"
    ADD CONSTRAINT "Migration_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."WatchSchemaFilePattern"
    ADD CONSTRAINT "WatchSchemaFilePattern_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "DocVersion_docId_version_key" ON "public"."DocVersion" USING "btree" ("docId", "version");



CREATE UNIQUE INDEX "GitHubDocFilePath_path_projectId_key" ON "public"."GitHubDocFilePath" USING "btree" ("path", "projectId");



CREATE UNIQUE INDEX "Migration_pullRequestId_key" ON "public"."Migration" USING "btree" ("pullRequestId");



CREATE UNIQUE INDEX "ProjectRepositoryMapping_projectId_repositoryId_key" ON "public"."ProjectRepositoryMapping" USING "btree" ("projectId", "repositoryId");



CREATE UNIQUE INDEX "PullRequest_repositoryId_pullNumber_key" ON "public"."PullRequest" USING "btree" ("repositoryId", "pullNumber");



CREATE UNIQUE INDEX "Repository_owner_name_key" ON "public"."Repository" USING "btree" ("owner", "name");



ALTER TABLE ONLY "public"."DocVersion"
    ADD CONSTRAINT "DocVersion_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."Doc"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Doc"
    ADD CONSTRAINT "Doc_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Migration"
    ADD CONSTRAINT "Migration_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "public"."PullRequest"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



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



ALTER TABLE ONLY "public"."WatchSchemaFilePattern"
    ADD CONSTRAINT "WatchSchemaFilePattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON UPDATE CASCADE ON DELETE RESTRICT;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON SEQUENCE "public"."DocVersion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."DocVersion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."DocVersion_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Doc_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Doc_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Doc_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "anon";
GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "authenticated";
GRANT ALL ON TABLE "public"."GitHubDocFilePath" TO "service_role";



GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."GitHubDocFilePath_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "anon";
GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "authenticated";
GRANT ALL ON TABLE "public"."KnowledgeSuggestion" TO "service_role";



GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."KnowledgeSuggestion_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Migration_id_seq" TO "service_role";



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



GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PullRequest_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Repository" TO "anon";
GRANT ALL ON TABLE "public"."Repository" TO "authenticated";
GRANT ALL ON TABLE "public"."Repository" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Repository_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."WatchSchemaFilePattern_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."WatchSchemaFilePattern_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."WatchSchemaFilePattern_id_seq" TO "service_role";



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
