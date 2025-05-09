

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


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_invitation_id uuid;
  v_result jsonb;
begin
  -- Start transaction
  begin
    v_user_id := auth.uid();

    -- Verify the invitation exists
    select
      i.id, i.organization_id into v_invitation_id, v_organization_id
    from invitations i
    join
      auth.users au on lower(i.email) = lower(au.email)
    where
      i.token = p_token
      and au.id = v_user_id
      and au.email_confirmed_at is not null
      and current_timestamp < i.expired_at
    limit 1;

    if v_invitation_id is null then
      v_result := jsonb_build_object(
        'success', false,
        'organizationId', null,
        'error', 'Invitation not found or already accepted'
      );
      return v_result;
    end if;

    -- Create organization member record
    insert into organization_members (
      user_id,
      organization_id,
      joined_at
    ) values (
      v_user_id,
      v_organization_id,
      current_timestamp
    );

    -- Delete the invitation
    delete from invitations
    where id = v_invitation_id;

    -- Return success
    v_result := jsonb_build_object(
      'success', true,
      'organizationId', v_organization_id,
      'error', null
    );
    return v_result;
  exception when others then
    -- Handle any errors
    v_result := jsonb_build_object(
      'success', false,
      'organizationId', null,
      'error', sqlerrm
    );
    return v_result;
  end;
end;
$$;


ALTER FUNCTION "public"."accept_invitation"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invitation_data"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
  v_organization_name text;
  v_result jsonb;
begin
  -- Start transaction
  begin
    v_user_id := auth.uid();

    select 
      o.name into v_organization_name
    from 
      invitations i
    join 
      organizations o on i.organization_id = o.id
    join 
      auth.users au on lower(i.email) = lower(au.email)
    where 
      i.token = p_token
      and au.id = v_user_id
      and au.email_confirmed_at is not null
      and current_timestamp < i.expired_at
    limit 1;

    v_result := jsonb_build_object(
      'organizationName', v_organization_name
    );
    return v_result;
  end;
end;
$$;


ALTER FUNCTION "public"."get_invitation_data"("p_token" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_is_member boolean;
  v_invite_by_user_id uuid;
  v_existing_invite_id uuid;
  v_new_token uuid;
  v_result jsonb;
begin
  -- Start transaction
  begin
    v_invite_by_user_id := auth.uid();

    -- Check inviter is a valid user
    if not exists (
      select 1
      from organization_members om
      where om.user_id = v_invite_by_user_id
      and om.organization_id = p_organization_id
    ) then
      v_result := jsonb_build_object(
        'success', false,
        'invitation_token', null,
        'error', 'inviter user does not exist'
      );
      return v_result;
    end if;

    -- Check if user is already a member
    select exists(
      select 1
      from organization_members om
      join users u on om.user_id = u.id
      where om.organization_id = p_organization_id
      and lower(u.email) = lower(p_email)
    ) into v_is_member;
    
    if v_is_member then
      v_result := jsonb_build_object(
        'success', false,
        'invitation_token', null,
        'error', 'this user is already a member of the organization'
      );
      return v_result;
    end if;
    
    v_new_token := gen_random_uuid();

    -- Check if invitation already exists
    select id into v_existing_invite_id
    from invitations
    where organization_id = p_organization_id
    and lower(email) = lower(p_email)
    limit 1;
    
    -- If invitation exists, update it
    if v_existing_invite_id is not null then
      update invitations
      set invited_at = current_timestamp,
      expired_at = current_timestamp + interval '7 days',
      invite_by_user_id = v_invite_by_user_id,
      token = v_new_token
      where id = v_existing_invite_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'invitation_token', v_new_token,
        'error', null
      );
    else
      -- Create new invitation
      insert into invitations (
        organization_id,
        email,
        invited_at,
        expired_at,
        invite_by_user_id,
        token
      ) values (
        p_organization_id,
        lower(p_email),
        current_timestamp,
        current_timestamp + interval '7 days',
        v_invite_by_user_id,
        v_new_token
      );
      
      v_result := jsonb_build_object(
        'success', true,
        'invitation_token', v_new_token,
        'error', null
      );
    end if;
    
    -- Commit transaction
    return v_result;
  exception when others then
    -- Handle any errors
    v_result := jsonb_build_object(
      'success', false,
      'invitation_token', null,
      'error', sqlerrm
    );
    return v_result;
  end;
end;
$$;


ALTER FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_org_member"("_org" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = _org
      AND om.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_current_user_org_member"("_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_delete_last_organization_member"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if this is the last member in the organization
  IF (SELECT COUNT(*) FROM organization_members WHERE organization_id = OLD.organization_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last member of an organization';
  END IF;

  -- If not the last member, allow the deletion
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_delete_last_organization_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM github_repositories WHERE id = NEW.repository_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_doc_file_paths_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_doc_file_paths_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_github_pull_request_comments_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT pr."organization_id" 
    FROM "public"."github_pull_requests" pr
    WHERE pr."id" = NEW.github_pull_request_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_github_pull_request_comments_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_github_pull_requests_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."github_repositories" 
    WHERE "id" = NEW.repository_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_github_pull_requests_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."knowledge_suggestions" 
    WHERE "id" = NEW.knowledge_suggestion_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_knowledge_suggestions_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_knowledge_suggestions_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."github_pull_requests" 
    WHERE "id" = NEW.pull_request_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_migrations_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_migrations_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."knowledge_suggestions" 
    WHERE "id" = NEW.knowledge_suggestion_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_overall_reviews_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT p."organization_id"
    FROM "public"."migrations" m
    JOIN "public"."projects" p ON m."project_id" = p."id"
    WHERE m."id" = NEW.migration_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_overall_reviews_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_project_repository_mappings_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_project_repository_mappings_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_review_feedback_comments_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."review_feedbacks" 
    WHERE "id" = NEW.review_feedback_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_review_feedback_comments_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."knowledge_suggestions" 
    WHERE "id" = NEW.knowledge_suggestion_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_review_feedbacks_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."overall_reviews" 
    WHERE "id" = NEW.overall_review_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_review_feedbacks_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_review_suggestion_snippets_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."review_feedbacks" 
    WHERE "id" = NEW.review_feedback_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_review_suggestion_snippets_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_schema_file_paths_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_schema_file_paths_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_schema_override_sources_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_schema_override_sources_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_table_groups_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_table_groups_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_table_overrides_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id FROM projects WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_table_overrides_organization_id"() OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."doc_file_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "is_review_enabled" boolean DEFAULT true NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."doc_file_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_pull_request_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "github_pull_request_id" "uuid" NOT NULL,
    "github_comment_identifier" bigint NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."github_pull_request_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."github_pull_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pull_number" bigint NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "repository_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL
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


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "invite_by_user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expired_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_suggestion_doc_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_suggestion_id" "uuid" NOT NULL,
    "doc_file_path_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
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
    "reasoning" "text" DEFAULT ''::"text",
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."knowledge_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migration_pull_request_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "migration_id" "uuid" NOT NULL,
    "pull_request_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."migration_pull_request_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "project_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL
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
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overall_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_comment" "text",
    "reviewed_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "branch_name" "text" NOT NULL,
    "trace_id" "text",
    "migration_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."overall_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_repository_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "repository_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
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
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."review_feedback_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_feedback_knowledge_suggestion_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid",
    "knowledge_suggestion_id" "uuid",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
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
    "resolution_comment" "text",
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."review_feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_suggestion_snippets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_feedback_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "snippet" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."review_suggestion_snippets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schema_file_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "format" "public"."schema_format_enum" NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."schema_file_paths" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doc_file_paths"
    ADD CONSTRAINT "github_doc_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_comment_identifier_key" UNIQUE ("github_comment_identifier");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_pull_request_id_key" UNIQUE ("github_pull_request_id");



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repository_github_repository_identifier_organization_id_" UNIQUE ("github_repository_identifier", "organization_id");



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



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



ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_group" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "table_group_id") WHERE ("table_group_id" IS NOT NULL);



CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_override" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "table_override_id") WHERE ("table_override_id" IS NOT NULL);



CREATE UNIQUE INDEX "branch_schema_override_mappings_unique_source" ON "public"."branch_schema_override_mappings" USING "btree" ("repository_id", "branch_or_commit", "schema_override_source_id") WHERE ("schema_override_source_id" IS NOT NULL);



CREATE UNIQUE INDEX "doc_file_path_path_project_id_key" ON "public"."doc_file_paths" USING "btree" ("path", "project_id");



CREATE UNIQUE INDEX "github_pull_request_repository_id_pull_number_key" ON "public"."github_pull_requests" USING "btree" ("repository_id", "pull_number");



CREATE UNIQUE INDEX "github_repository_owner_name_key" ON "public"."github_repositories" USING "btree" ("owner", "name");



CREATE INDEX "idx_project_organization_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_review_feedback_comment_review_feedback_id" ON "public"."review_feedback_comments" USING "btree" ("review_feedback_id");



CREATE INDEX "invitations_email_idx" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "invitations_organization_id_idx" ON "public"."invitations" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "knowledge_suggestion_doc_mapping_unique_mapping" ON "public"."knowledge_suggestion_doc_mappings" USING "btree" ("knowledge_suggestion_id", "doc_file_path_id");



CREATE INDEX "organization_member_organization_id_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organization_member_user_id_idx" ON "public"."organization_members" USING "btree" ("user_id");



CREATE UNIQUE INDEX "overall_review_knowledge_suggestion_mapping_unique_mapping" ON "public"."overall_review_knowledge_suggestion_mappings" USING "btree" ("overall_review_id", "knowledge_suggestion_id");



CREATE UNIQUE INDEX "project_repository_mapping_project_id_repository_id_key" ON "public"."project_repository_mappings" USING "btree" ("project_id", "repository_id");



CREATE UNIQUE INDEX "schema_file_path_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("path", "project_id");



CREATE UNIQUE INDEX "schema_file_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("project_id");



CREATE UNIQUE INDEX "schema_override_sources_project_id_path_key" ON "public"."schema_override_sources" USING "btree" ("project_id", "path");



CREATE UNIQUE INDEX "table_groups_project_id_name_key" ON "public"."table_groups" USING "btree" ("project_id", "name");



CREATE UNIQUE INDEX "table_overrides_project_id_table_name_key" ON "public"."table_overrides" USING "btree" ("project_id", "table_name");



CREATE OR REPLACE TRIGGER "check_last_organization_member" BEFORE DELETE ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_delete_last_organization_member"();



COMMENT ON TRIGGER "check_last_organization_member" ON "public"."organization_members" IS 'Prevents deletion of the last member of an organization to ensure organizations always have at least one member';



CREATE OR REPLACE TRIGGER "set_branch_schema_override_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."branch_schema_override_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_branch_schema_override_mappings_organization_id"();



CREATE OR REPLACE TRIGGER "set_doc_file_paths_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."doc_file_paths" FOR EACH ROW EXECUTE FUNCTION "public"."set_doc_file_paths_organization_id"();



CREATE OR REPLACE TRIGGER "set_github_pull_request_comments_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."github_pull_request_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_github_pull_request_comments_organization_id"();



CREATE OR REPLACE TRIGGER "set_github_pull_requests_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."github_pull_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_github_pull_requests_organization_id"();



CREATE OR REPLACE TRIGGER "set_knowledge_suggestion_doc_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."knowledge_suggestion_doc_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"();



CREATE OR REPLACE TRIGGER "set_knowledge_suggestions_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."knowledge_suggestions" FOR EACH ROW EXECUTE FUNCTION "public"."set_knowledge_suggestions_organization_id"();



CREATE OR REPLACE TRIGGER "set_migration_pull_request_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."migration_pull_request_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_migration_pull_request_mappings_organization_id"();



CREATE OR REPLACE TRIGGER "set_migrations_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."migrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_migrations_organization_id"();



CREATE OR REPLACE TRIGGER "set_overall_review_knowledge_suggestion_mappings_organization_i" BEFORE INSERT OR UPDATE ON "public"."overall_review_knowledge_suggestion_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"();



CREATE OR REPLACE TRIGGER "set_overall_reviews_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."overall_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_overall_reviews_organization_id"();



CREATE OR REPLACE TRIGGER "set_project_repository_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."project_repository_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_project_repository_mappings_organization_id"();



CREATE OR REPLACE TRIGGER "set_review_feedback_comments_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."review_feedback_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_review_feedback_comments_organization_id"();



CREATE OR REPLACE TRIGGER "set_review_feedback_knowledge_suggestion_mappings_organization_" BEFORE INSERT OR UPDATE ON "public"."review_feedback_knowledge_suggestion_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"();



CREATE OR REPLACE TRIGGER "set_review_feedbacks_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."review_feedbacks" FOR EACH ROW EXECUTE FUNCTION "public"."set_review_feedbacks_organization_id"();



CREATE OR REPLACE TRIGGER "set_review_suggestion_snippets_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."review_suggestion_snippets" FOR EACH ROW EXECUTE FUNCTION "public"."set_review_suggestion_snippets_organization_id"();



CREATE OR REPLACE TRIGGER "set_schema_file_paths_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."schema_file_paths" FOR EACH ROW EXECUTE FUNCTION "public"."set_schema_file_paths_organization_id"();



CREATE OR REPLACE TRIGGER "set_schema_override_sources_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."schema_override_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_schema_override_sources_organization_id"();



CREATE OR REPLACE TRIGGER "set_table_groups_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."table_groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_table_groups_organization_id"();



CREATE OR REPLACE TRIGGER "set_table_overrides_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."table_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."set_table_overrides_organization_id"();



ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_schema_override_source_id_fkey" FOREIGN KEY ("schema_override_source_id") REFERENCES "public"."schema_override_sources"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_table_group_id_fkey" FOREIGN KEY ("table_group_id") REFERENCES "public"."table_groups"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branch_schema_override_mappings"
    ADD CONSTRAINT "branch_schema_override_mappings_table_override_id_fkey" FOREIGN KEY ("table_override_id") REFERENCES "public"."table_overrides"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doc_file_paths"
    ADD CONSTRAINT "doc_file_paths_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."doc_file_paths"
    ADD CONSTRAINT "github_doc_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_github_pull_request_id_fkey" FOREIGN KEY ("github_pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."github_pull_request_comments"
    ADD CONSTRAINT "github_pull_request_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_pull_requests"
    ADD CONSTRAINT "github_pull_request_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_pull_requests"
    ADD CONSTRAINT "github_pull_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invite_by_user_id_fkey" FOREIGN KEY ("invite_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_doc_file_path_id_fkey" FOREIGN KEY ("doc_file_path_id") REFERENCES "public"."doc_file_paths"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mapping_knowledge_suggestion_id_fkey" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_suggestion_doc_mappings"
    ADD CONSTRAINT "knowledge_suggestion_doc_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."knowledge_suggestions"
    ADD CONSTRAINT "knowledge_suggestions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mapping_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "public"."migrations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mapping_pull_request_id_fkey" FOREIGN KEY ("pull_request_id") REFERENCES "public"."github_pull_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."migration_pull_request_mappings"
    ADD CONSTRAINT "migration_pull_request_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_knowledge_suggestio" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mapping_overall_review_id_f" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."overall_review_knowledge_suggestion_mappings"
    ADD CONSTRAINT "overall_review_knowledge_suggestion_mappings_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_review_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "public"."migrations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."overall_reviews"
    ADD CONSTRAINT "overall_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_feedback_comments"
    ADD CONSTRAINT "review_feedback_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedback_knowledge_suggestion_mappings"
    ADD CONSTRAINT "review_feedback_knowledge_suggesti_knowledge_suggestion_id_fkey" FOREIGN KEY ("knowledge_suggestion_id") REFERENCES "public"."knowledge_suggestions"("id");



ALTER TABLE ONLY "public"."review_feedback_knowledge_suggestion_mappings"
    ADD CONSTRAINT "review_feedback_knowledge_suggestion_ma_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id");



ALTER TABLE ONLY "public"."review_feedback_knowledge_suggestion_mappings"
    ADD CONSTRAINT "review_feedback_knowledge_suggestion_mappings_organization_id_f" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedbacks"
    ADD CONSTRAINT "review_feedback_overall_review_id_fkey" FOREIGN KEY ("overall_review_id") REFERENCES "public"."overall_reviews"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_feedbacks"
    ADD CONSTRAINT "review_feedbacks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."review_suggestion_snippets"
    ADD CONSTRAINT "review_suggestion_snippet_review_feedback_id_fkey" FOREIGN KEY ("review_feedback_id") REFERENCES "public"."review_feedbacks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_suggestion_snippets"
    ADD CONSTRAINT "review_suggestion_snippets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "schema_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "schema_file_paths_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_override_sources"
    ADD CONSTRAINT "schema_override_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."table_groups"
    ADD CONSTRAINT "table_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."table_overrides"
    ADD CONSTRAINT "table_overrides_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "authenticated_users_can_delete_org_invitations" ON "public"."invitations" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_delete_org_organization_members" ON "public"."organization_members" FOR DELETE TO "authenticated" USING ("public"."is_current_user_org_member"("organization_id"));



COMMENT ON POLICY "authenticated_users_can_delete_org_organization_members" ON "public"."organization_members" IS 'Authenticated users can only remove members from organizations they belong to';



CREATE POLICY "authenticated_users_can_delete_org_organizations" ON "public"."organizations" FOR DELETE TO "authenticated" USING (("id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_organizations" ON "public"."organizations" IS 'Authenticated users can only delete organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_projects" ON "public"."projects" IS 'Authenticated users can only delete projects in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_branch_schema_override_mappi" ON "public"."branch_schema_override_mappings" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_doc_file_paths" ON "public"."doc_file_paths" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_doc_file_paths" ON "public"."doc_file_paths" IS 'Authenticated users can insert doc file paths for their organization';



CREATE POLICY "authenticated_users_can_insert_org_github_repositories" ON "public"."github_repositories" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_github_repositories" ON "public"."github_repositories" IS 'Authenticated users can only create repositories in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_invitations" ON "public"."invitations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_knowledge_suggestion_doc_map" ON "public"."knowledge_suggestion_doc_mappings" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_knowledge_suggestion_doc_map" ON "public"."knowledge_suggestion_doc_mappings" IS 'Authenticated users can only create knowledge suggestion doc mappings in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_knowledge_suggestions" ON "public"."knowledge_suggestions" IS 'Authenticated users can only create knowledge suggestions in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_organization_members" ON "public"."organization_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_current_user_org_member"("organization_id")));



COMMENT ON POLICY "authenticated_users_can_insert_org_organization_members" ON "public"."organization_members" IS 'Authenticated users can add themselves to any organization or add members to organizations they belong to';



CREATE POLICY "authenticated_users_can_insert_org_project_repository_mappings" ON "public"."project_repository_mappings" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_project_repository_mappings" ON "public"."project_repository_mappings" IS 'Authenticated users can only create project repository mappings in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_review_feedback_comments" ON "public"."review_feedback_comments" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_review_feedback_comments" ON "public"."review_feedback_comments" IS 'Authenticated users can only insert review feedback comments in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_schema_file_paths" ON "public"."schema_file_paths" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only create schema file paths in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_schema_override_sources" ON "public"."schema_override_sources" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_table_groups" ON "public"."table_groups" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_table_overrides" ON "public"."table_overrides" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" IS 'Authenticated users can create any organization';



CREATE POLICY "authenticated_users_can_insert_projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_projects" ON "public"."projects" IS 'Authenticated users can create any project';



CREATE POLICY "authenticated_users_can_select_org_branch_schema_override_mappi" ON "public"."branch_schema_override_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_doc_file_paths" ON "public"."doc_file_paths" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_doc_file_paths" ON "public"."doc_file_paths" IS 'Authenticated users can select doc file paths for their organization';



CREATE POLICY "authenticated_users_can_select_org_github_pull_requests" ON "public"."github_pull_requests" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_github_pull_requests" ON "public"."github_pull_requests" IS 'Authenticated users can only view pull requests belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_github_repositories" ON "public"."github_repositories" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_github_repositories" ON "public"."github_repositories" IS 'Authenticated users can only view repositories belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_invitations" ON "public"."invitations" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_knowledge_suggestion_doc_map" ON "public"."knowledge_suggestion_doc_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_knowledge_suggestion_doc_map" ON "public"."knowledge_suggestion_doc_mappings" IS 'Authenticated users can only view knowledge suggestion doc mappings belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_knowledge_suggestions" ON "public"."knowledge_suggestions" IS 'Authenticated users can only view knowledge suggestions belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_migration_pull_request_mappi" ON "public"."migration_pull_request_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_migration_pull_request_mappi" ON "public"."migration_pull_request_mappings" IS 'Authenticated users can only view mappings belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_migrations" ON "public"."migrations" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_migrations" ON "public"."migrations" IS 'Authenticated users can only view migrations belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_organization_members" ON "public"."organization_members" FOR SELECT TO "authenticated" USING ("public"."is_current_user_org_member"("organization_id"));



COMMENT ON POLICY "authenticated_users_can_select_org_organization_members" ON "public"."organization_members" IS 'Authenticated users can only view members of organizations they belong to';



CREATE POLICY "authenticated_users_can_select_org_organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "authenticated_users_can_select_org_organizations" ON "public"."organizations" IS 'Authenticated users can only view organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_overall_review_knowledge_sug" ON "public"."overall_review_knowledge_suggestion_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_overall_review_knowledge_sug" ON "public"."overall_review_knowledge_suggestion_mappings" IS 'Authenticated users can only view mappings belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_overall_reviews" ON "public"."overall_reviews" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_overall_reviews" ON "public"."overall_reviews" IS 'Authenticated users can only view overall reviews belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_project_repository_mappings" ON "public"."project_repository_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_project_repository_mappings" ON "public"."project_repository_mappings" IS 'Authenticated users can only view project repository mappings belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" IS 'Authenticated users can only view projects belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_review_feedback_comments" ON "public"."review_feedback_comments" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_review_feedback_comments" ON "public"."review_feedback_comments" IS 'Authenticated users can only view review feedback comments belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_review_feedback_knowledge_su" ON "public"."review_feedback_knowledge_suggestion_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_review_feedbacks" ON "public"."review_feedbacks" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_review_feedbacks" ON "public"."review_feedbacks" IS 'Authenticated users can only view review feedbacks belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_review_suggestion_snippets" ON "public"."review_suggestion_snippets" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_review_suggestion_snippets" ON "public"."review_suggestion_snippets" IS 'Authenticated users can only view review suggestion snippets belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_schema_file_paths" ON "public"."schema_file_paths" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only view schema file paths belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_schema_override_sources" ON "public"."schema_override_sources" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_table_groups" ON "public"."table_groups" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_table_overrides" ON "public"."table_overrides" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_branch_schema_override_mappi" ON "public"."branch_schema_override_mappings" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_invitations" ON "public"."invitations" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_knowledge_suggestions" ON "public"."knowledge_suggestions" IS 'Authenticated users can only update knowledge suggestions in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_organizations" ON "public"."organizations" FOR UPDATE TO "authenticated" USING (("id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_organizations" ON "public"."organizations" IS 'Authenticated users can only update organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_projects" ON "public"."projects" IS 'Authenticated users can only update projects in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_review_feedbacks" ON "public"."review_feedbacks" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_review_feedbacks" ON "public"."review_feedbacks" IS 'Authenticated users can only update review feedbacks belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_schema_file_paths" ON "public"."schema_file_paths" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only update schema file paths in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_schema_override_sources" ON "public"."schema_override_sources" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_table_groups" ON "public"."table_groups" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_table_overrides" ON "public"."table_overrides" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."branch_schema_override_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."doc_file_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_pull_request_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_pull_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_repositories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_suggestion_doc_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."migration_pull_request_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."overall_review_knowledge_suggestion_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."overall_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_repository_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_feedback_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_feedback_knowledge_suggestion_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_suggestion_snippets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schema_file_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schema_override_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_delete_all_invitations" ON "public"."invitations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_organizations" ON "public"."organizations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_projects" ON "public"."projects" FOR DELETE TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_delete_all_projects" ON "public"."projects" IS 'Service role can delete any project (for jobs)';



CREATE POLICY "service_role_can_insert_all_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_github_pull_request_comments" ON "public"."github_pull_request_comments" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_github_pull_requests" ON "public"."github_pull_requests" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_invitations" ON "public"."invitations" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_knowledge_suggestion_doc_mappings" ON "public"."knowledge_suggestion_doc_mappings" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_migration_pull_request_mappings" ON "public"."migration_pull_request_mappings" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_migrations" ON "public"."migrations" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_organizations" ON "public"."organizations" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_overall_review_knowledge_suggestion" ON "public"."overall_review_knowledge_suggestion_mappings" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_overall_reviews" ON "public"."overall_reviews" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_projects" ON "public"."projects" FOR INSERT TO "service_role" WITH CHECK (true);



COMMENT ON POLICY "service_role_can_insert_all_projects" ON "public"."projects" IS 'Service role can create any project (for jobs)';



CREATE POLICY "service_role_can_insert_all_review_feedback_knowledge_suggestio" ON "public"."review_feedback_knowledge_suggestion_mappings" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_review_feedbacks" ON "public"."review_feedbacks" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_review_suggestion_snippets" ON "public"."review_suggestion_snippets" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_schema_override_sources" ON "public"."schema_override_sources" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_table_groups" ON "public"."table_groups" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_table_overrides" ON "public"."table_overrides" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_select_all_branch_schema_override_mappings" ON "public"."branch_schema_override_mappings" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_doc_file_paths" ON "public"."doc_file_paths" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_github_pull_request_comments" ON "public"."github_pull_request_comments" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_github_pull_requests" ON "public"."github_pull_requests" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_github_repositories" ON "public"."github_repositories" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_invitations" ON "public"."invitations" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_migration_pull_request_mappings" ON "public"."migration_pull_request_mappings" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_migrations" ON "public"."migrations" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_organizations" ON "public"."organizations" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_overall_reviews" ON "public"."overall_reviews" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_project_repository_mappings" ON "public"."project_repository_mappings" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_projects" ON "public"."projects" FOR SELECT TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_select_all_projects" ON "public"."projects" IS 'Service role can view all projects (for jobs)';



CREATE POLICY "service_role_can_select_all_review_feedback_knowledge_suggestio" ON "public"."review_feedback_knowledge_suggestion_mappings" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_schema_file_paths" ON "public"."schema_file_paths" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_schema_override_sources" ON "public"."schema_override_sources" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_table_groups" ON "public"."table_groups" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_table_overrides" ON "public"."table_overrides" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_update_all_invitations" ON "public"."invitations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_migrations" ON "public"."migrations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_organizations" ON "public"."organizations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_projects" ON "public"."projects" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_can_update_all_projects" ON "public"."projects" IS 'Service role can update any project (for jobs)';



ALTER TABLE "public"."table_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."table_overrides" ENABLE ROW LEVEL SECURITY;


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

















































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_branch_schema_override_mappings_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_doc_file_paths_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_doc_file_paths_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_doc_file_paths_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_github_pull_request_comments_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_github_pull_request_comments_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_github_pull_request_comments_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_github_pull_requests_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_github_pull_requests_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_github_pull_requests_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_knowledge_suggestion_doc_mappings_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_knowledge_suggestions_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_knowledge_suggestions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_knowledge_suggestions_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_migration_pull_request_mappings_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_migrations_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_migrations_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_migrations_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_overall_review_knowledge_suggestion_mappings_organization_i"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_overall_reviews_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_overall_reviews_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_overall_reviews_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_project_repository_mappings_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_project_repository_mappings_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_project_repository_mappings_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_review_feedback_comments_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_review_feedback_comments_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_review_feedback_comments_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_review_feedback_knowledge_suggestion_mappings_organization_"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_review_feedbacks_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_review_feedbacks_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_review_feedbacks_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_review_suggestion_snippets_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_review_suggestion_snippets_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_review_suggestion_snippets_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_schema_file_paths_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_schema_file_paths_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_schema_file_paths_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_schema_override_sources_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_schema_override_sources_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_schema_override_sources_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_table_groups_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_table_groups_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_table_groups_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_table_overrides_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_table_overrides_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_table_overrides_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "service_role";


















GRANT ALL ON TABLE "public"."branch_schema_override_mappings" TO "anon";
GRANT ALL ON TABLE "public"."branch_schema_override_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."branch_schema_override_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."doc_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."doc_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."doc_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "anon";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "service_role";



GRANT ALL ON TABLE "public"."github_pull_requests" TO "anon";
GRANT ALL ON TABLE "public"."github_pull_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."github_pull_requests" TO "service_role";



GRANT ALL ON TABLE "public"."github_repositories" TO "anon";
GRANT ALL ON TABLE "public"."github_repositories" TO "authenticated";
GRANT ALL ON TABLE "public"."github_repositories" TO "service_role";



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



GRANT ALL ON TABLE "public"."schema_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."schema_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."schema_override_sources" TO "anon";
GRANT ALL ON TABLE "public"."schema_override_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_override_sources" TO "service_role";



GRANT ALL ON TABLE "public"."table_groups" TO "anon";
GRANT ALL ON TABLE "public"."table_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."table_groups" TO "service_role";



GRANT ALL ON TABLE "public"."table_overrides" TO "anon";
GRANT ALL ON TABLE "public"."table_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."table_overrides" TO "service_role";



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
