--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: KnowledgeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KnowledgeType" AS ENUM (
    'SCHEMA',
    'DOCS'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Doc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Doc" (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "latestVersionId" integer,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DocVersion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocVersion" (
    id integer NOT NULL,
    "docId" integer NOT NULL,
    version integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    title text NOT NULL
);


--
-- Name: DocVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DocVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DocVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DocVersion_id_seq" OWNED BY public."DocVersion".id;


--
-- Name: Doc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Doc_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Doc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Doc_id_seq" OWNED BY public."Doc".id;


--
-- Name: GitHubDocFilePath; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GitHubDocFilePath" (
    id integer NOT NULL,
    path text NOT NULL,
    "isReviewEnabled" boolean DEFAULT true NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GitHubDocFilePath_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GitHubDocFilePath_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GitHubDocFilePath_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GitHubDocFilePath_id_seq" OWNED BY public."GitHubDocFilePath".id;


--
-- Name: KnowledgeSuggestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."KnowledgeSuggestion" (
    id integer NOT NULL,
    type public."KnowledgeType" NOT NULL,
    title text NOT NULL,
    path text NOT NULL,
    content text NOT NULL,
    "fileSha" text NOT NULL,
    "projectId" integer NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" text NOT NULL
);


--
-- Name: KnowledgeSuggestion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."KnowledgeSuggestion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: KnowledgeSuggestion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."KnowledgeSuggestion_id_seq" OWNED BY public."KnowledgeSuggestion".id;


--
-- Name: Migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Migration" (
    id integer NOT NULL,
    title text NOT NULL,
    "pullRequestId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Migration_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Migration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Migration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Migration_id_seq" OWNED BY public."Migration".id;


--
-- Name: OverallReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OverallReview" (
    id integer NOT NULL,
    "projectId" integer,
    "pullRequestId" integer NOT NULL,
    "reviewComment" text,
    "reviewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchName" text NOT NULL
);


--
-- Name: OverallReview_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OverallReview_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OverallReview_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OverallReview_id_seq" OWNED BY public."OverallReview".id;


--
-- Name: Project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Project" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProjectRepositoryMapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProjectRepositoryMapping" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    "repositoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProjectRepositoryMapping_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ProjectRepositoryMapping_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ProjectRepositoryMapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ProjectRepositoryMapping_id_seq" OWNED BY public."ProjectRepositoryMapping".id;


--
-- Name: Project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Project_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Project_id_seq" OWNED BY public."Project".id;


--
-- Name: PullRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PullRequest" (
    id integer NOT NULL,
    "pullNumber" bigint NOT NULL,
    "commentId" bigint,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "repositoryId" integer NOT NULL
);


--
-- Name: PullRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PullRequest_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PullRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PullRequest_id_seq" OWNED BY public."PullRequest".id;


--
-- Name: Repository; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Repository" (
    id integer NOT NULL,
    name text NOT NULL,
    owner text NOT NULL,
    "installationId" bigint NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Repository_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Repository_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Repository_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Repository_id_seq" OWNED BY public."Repository".id;


--
-- Name: WatchSchemaFilePattern; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WatchSchemaFilePattern" (
    id integer NOT NULL,
    pattern text NOT NULL,
    "projectId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WatchSchemaFilePattern_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."WatchSchemaFilePattern_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: WatchSchemaFilePattern_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."WatchSchemaFilePattern_id_seq" OWNED BY public."WatchSchemaFilePattern".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Doc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Doc" ALTER COLUMN id SET DEFAULT nextval('public."Doc_id_seq"'::regclass);


--
-- Name: DocVersion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocVersion" ALTER COLUMN id SET DEFAULT nextval('public."DocVersion_id_seq"'::regclass);


--
-- Name: GitHubDocFilePath id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GitHubDocFilePath" ALTER COLUMN id SET DEFAULT nextval('public."GitHubDocFilePath_id_seq"'::regclass);


--
-- Name: KnowledgeSuggestion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnowledgeSuggestion" ALTER COLUMN id SET DEFAULT nextval('public."KnowledgeSuggestion_id_seq"'::regclass);


--
-- Name: Migration id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Migration" ALTER COLUMN id SET DEFAULT nextval('public."Migration_id_seq"'::regclass);


--
-- Name: OverallReview id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OverallReview" ALTER COLUMN id SET DEFAULT nextval('public."OverallReview_id_seq"'::regclass);


--
-- Name: Project id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project" ALTER COLUMN id SET DEFAULT nextval('public."Project_id_seq"'::regclass);


--
-- Name: ProjectRepositoryMapping id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProjectRepositoryMapping" ALTER COLUMN id SET DEFAULT nextval('public."ProjectRepositoryMapping_id_seq"'::regclass);


--
-- Name: PullRequest id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PullRequest" ALTER COLUMN id SET DEFAULT nextval('public."PullRequest_id_seq"'::regclass);


--
-- Name: Repository id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Repository" ALTER COLUMN id SET DEFAULT nextval('public."Repository_id_seq"'::regclass);


--
-- Name: WatchSchemaFilePattern id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WatchSchemaFilePattern" ALTER COLUMN id SET DEFAULT nextval('public."WatchSchemaFilePattern_id_seq"'::regclass);


--
-- Name: DocVersion DocVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocVersion"
    ADD CONSTRAINT "DocVersion_pkey" PRIMARY KEY (id);


--
-- Name: Doc Doc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Doc"
    ADD CONSTRAINT "Doc_pkey" PRIMARY KEY (id);


--
-- Name: GitHubDocFilePath GitHubDocFilePath_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeSuggestion KnowledgeSuggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY (id);


--
-- Name: Migration Migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Migration"
    ADD CONSTRAINT "Migration_pkey" PRIMARY KEY (id);


--
-- Name: OverallReview OverallReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OverallReview"
    ADD CONSTRAINT "OverallReview_pkey" PRIMARY KEY (id);


--
-- Name: ProjectRepositoryMapping ProjectRepositoryMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: PullRequest PullRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PullRequest"
    ADD CONSTRAINT "PullRequest_pkey" PRIMARY KEY (id);


--
-- Name: Repository Repository_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Repository"
    ADD CONSTRAINT "Repository_pkey" PRIMARY KEY (id);


--
-- Name: WatchSchemaFilePattern WatchSchemaFilePattern_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WatchSchemaFilePattern"
    ADD CONSTRAINT "WatchSchemaFilePattern_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: DocVersion_docId_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DocVersion_docId_version_key" ON public."DocVersion" USING btree ("docId", version);


--
-- Name: GitHubDocFilePath_path_projectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GitHubDocFilePath_path_projectId_key" ON public."GitHubDocFilePath" USING btree (path, "projectId");


--
-- Name: Migration_pullRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Migration_pullRequestId_key" ON public."Migration" USING btree ("pullRequestId");


--
-- Name: ProjectRepositoryMapping_projectId_repositoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProjectRepositoryMapping_projectId_repositoryId_key" ON public."ProjectRepositoryMapping" USING btree ("projectId", "repositoryId");


--
-- Name: PullRequest_repositoryId_pullNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PullRequest_repositoryId_pullNumber_key" ON public."PullRequest" USING btree ("repositoryId", "pullNumber");


--
-- Name: Repository_owner_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Repository_owner_name_key" ON public."Repository" USING btree (owner, name);


--
-- Name: DocVersion DocVersion_docId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocVersion"
    ADD CONSTRAINT "DocVersion_docId_fkey" FOREIGN KEY ("docId") REFERENCES public."Doc"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Doc Doc_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Doc"
    ADD CONSTRAINT "Doc_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GitHubDocFilePath GitHubDocFilePath_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GitHubDocFilePath"
    ADD CONSTRAINT "GitHubDocFilePath_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: KnowledgeSuggestion KnowledgeSuggestion_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnowledgeSuggestion"
    ADD CONSTRAINT "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Migration Migration_pullRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Migration"
    ADD CONSTRAINT "Migration_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES public."PullRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OverallReview OverallReview_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OverallReview"
    ADD CONSTRAINT "OverallReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OverallReview OverallReview_pullRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OverallReview"
    ADD CONSTRAINT "OverallReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES public."PullRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectRepositoryMapping ProjectRepositoryMapping_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectRepositoryMapping ProjectRepositoryMapping_repositoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProjectRepositoryMapping"
    ADD CONSTRAINT "ProjectRepositoryMapping_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES public."Repository"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PullRequest PullRequest_repositoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PullRequest"
    ADD CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES public."Repository"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WatchSchemaFilePattern WatchSchemaFilePattern_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WatchSchemaFilePattern"
    ADD CONSTRAINT "WatchSchemaFilePattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SEQUENCE "DocVersion_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."DocVersion_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."DocVersion_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."DocVersion_id_seq" TO service_role;


--
-- Name: SEQUENCE "Doc_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."Doc_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Doc_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Doc_id_seq" TO service_role;


--
-- Name: TABLE "GitHubDocFilePath"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."GitHubDocFilePath" TO anon;
GRANT ALL ON TABLE public."GitHubDocFilePath" TO authenticated;
GRANT ALL ON TABLE public."GitHubDocFilePath" TO service_role;


--
-- Name: SEQUENCE "GitHubDocFilePath_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."GitHubDocFilePath_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."GitHubDocFilePath_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."GitHubDocFilePath_id_seq" TO service_role;


--
-- Name: TABLE "KnowledgeSuggestion"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."KnowledgeSuggestion" TO anon;
GRANT ALL ON TABLE public."KnowledgeSuggestion" TO authenticated;
GRANT ALL ON TABLE public."KnowledgeSuggestion" TO service_role;


--
-- Name: SEQUENCE "KnowledgeSuggestion_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."KnowledgeSuggestion_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."KnowledgeSuggestion_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."KnowledgeSuggestion_id_seq" TO service_role;


--
-- Name: SEQUENCE "Migration_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."Migration_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Migration_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Migration_id_seq" TO service_role;


--
-- Name: SEQUENCE "OverallReview_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."OverallReview_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."OverallReview_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."OverallReview_id_seq" TO service_role;


--
-- Name: TABLE "Project"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Project" TO anon;
GRANT ALL ON TABLE public."Project" TO authenticated;
GRANT ALL ON TABLE public."Project" TO service_role;


--
-- Name: TABLE "ProjectRepositoryMapping"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."ProjectRepositoryMapping" TO anon;
GRANT ALL ON TABLE public."ProjectRepositoryMapping" TO authenticated;
GRANT ALL ON TABLE public."ProjectRepositoryMapping" TO service_role;


--
-- Name: SEQUENCE "ProjectRepositoryMapping_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."ProjectRepositoryMapping_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."ProjectRepositoryMapping_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."ProjectRepositoryMapping_id_seq" TO service_role;


--
-- Name: SEQUENCE "Project_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."Project_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Project_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Project_id_seq" TO service_role;


--
-- Name: SEQUENCE "PullRequest_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."PullRequest_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."PullRequest_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."PullRequest_id_seq" TO service_role;


--
-- Name: TABLE "Repository"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Repository" TO anon;
GRANT ALL ON TABLE public."Repository" TO authenticated;
GRANT ALL ON TABLE public."Repository" TO service_role;


--
-- Name: SEQUENCE "Repository_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."Repository_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."Repository_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."Repository_id_seq" TO service_role;


--
-- Name: SEQUENCE "WatchSchemaFilePattern_id_seq"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public."WatchSchemaFilePattern_id_seq" TO anon;
GRANT ALL ON SEQUENCE public."WatchSchemaFilePattern_id_seq" TO authenticated;
GRANT ALL ON SEQUENCE public."WatchSchemaFilePattern_id_seq" TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- PostgreSQL database dump complete
--

