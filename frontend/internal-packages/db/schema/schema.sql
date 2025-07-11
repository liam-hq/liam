

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






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."category_enum" AS ENUM (
    'MIGRATION_SAFETY',
    'DATA_INTEGRITY',
    'PERFORMANCE_IMPACT',
    'PROJECT_RULES_CONSISTENCY',
    'SECURITY_OR_SCALABILITY'
);


ALTER TYPE "public"."category_enum" OWNER TO "postgres";


CREATE TYPE "public"."execution_status_enum" AS ENUM (
    'idle',
    'running',
    'success',
    'failure'
);


ALTER TYPE "public"."execution_status_enum" OWNER TO "postgres";


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


CREATE TYPE "public"."timeline_item_type_enum" AS ENUM (
    'user',
    'assistant',
    'schema_version',
    'error',
    'assistant_log'
);


ALTER TYPE "public"."timeline_item_type_enum" OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_result jsonb;
  v_project_id uuid;
  v_repository_id uuid;
  v_now timestamp;
begin
  -- Start transaction
  begin
    v_now := now();
    
    -- 1. Create project
    insert into projects (
      name,
      organization_id,
      created_at,
      updated_at
    ) values (
      p_project_name,
      p_organization_id,
      v_now,
      v_now
    ) returning id into v_project_id;

    -- 2. Create github repository
    insert into github_repositories (
      name,
      owner,
      github_installation_identifier,
      github_repository_identifier,
      organization_id,
      updated_at
    ) values (
      p_repository_name,
      p_repository_owner,
      p_installation_id,
      p_repository_identifier,
      p_organization_id,
      v_now
    ) returning id into v_repository_id;

    -- 3. Create project-repository mapping
    insert into project_repository_mappings (
      project_id,
      repository_id,
      organization_id,
      updated_at
    ) values (
      v_project_id,
      v_repository_id,
      p_organization_id,
      v_now
    );

    -- Return success with project and repository IDs
    v_result := jsonb_build_object(
      'success', true,
      'project_id', v_project_id,
      'repository_id', v_repository_id
    );
    return v_result;
    
  exception when others then
    -- Handle any errors and rollback transaction
    v_result := jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
    return v_result;
  end;
end;
$$;


ALTER FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."match_documents"("filter" "jsonb" DEFAULT '{}'::"jsonb", "match_count" integer DEFAULT 10, "query_embedding" "public"."vector" DEFAULT NULL::"public"."vector", "match_threshold" double precision DEFAULT 0.3) RETURNS TABLE("id" "uuid", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  -- Check which signature is being used based on parameters
  if query_embedding is null and filter ? 'query_embedding' then
    -- Extract query_embedding from filter if provided in that format
    query_embedding := (filter->>'query_embedding')::vector(1536);
  end if;

  -- Ensure we have a valid query_embedding
  if query_embedding is null then
    raise exception 'query_embedding is required';
  end if;

  -- Return matching documents
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("filter" "jsonb", "match_count" integer, "query_embedding" "public"."vector", "match_threshold" double precision) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."set_artifacts_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_artifacts_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_building_schema_versions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  new.organization_id := (
    select "organization_id" 
    from "public"."building_schemas"
    where "id" = new.building_schema_id
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."set_building_schema_versions_organization_id"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."set_design_sessions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If project_id is provided, get organization_id from projects table
  IF NEW.project_id IS NOT NULL THEN
    NEW.organization_id := (
      SELECT organization_id
      FROM public.projects
      WHERE id = NEW.project_id
    );
  -- If project_id is NULL, organization_id must be explicitly provided
  -- This will be handled at the application level to ensure security
  ELSIF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id must be provided when project_id is NULL';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_design_sessions_organization_id"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."set_timeline_items_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_timeline_items_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_validation_queries_organization_id"() RETURNS "trigger"
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


ALTER FUNCTION "public"."set_validation_queries_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_validation_results_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.organization_id := (
    SELECT "organization_id" 
    FROM "public"."validation_queries" 
    WHERE "id" = NEW.validation_query_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_validation_results_organization_id"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_artifacts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_artifacts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_version_id uuid;
  v_new_message_id uuid;
  v_design_session_id uuid;
  v_organization_id uuid;
  v_new_version_number integer;
  v_actual_latest_version_number integer;
BEGIN
  -- Get the latest version number
  SELECT COALESCE(MAX(number), 0) INTO v_actual_latest_version_number
  FROM building_schema_versions
  WHERE building_schema_id = p_schema_id;

  -- Check for version conflict
  IF v_actual_latest_version_number != p_latest_schema_version_number THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'VERSION_CONFLICT',
      'message', format('Version conflict: expected version %s but current version is %s', 
                       p_latest_schema_version_number, v_actual_latest_version_number)
    );
  END IF;

  -- Get design_session_id and organization_id
  SELECT design_session_id, organization_id 
  INTO v_design_session_id, v_organization_id
  FROM building_schemas
  WHERE id = p_schema_id;

  IF v_design_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SCHEMA_NOT_FOUND',
      'message', 'Building schema not found'
    );
  END IF;

  -- Update the schema
  UPDATE building_schemas
  SET schema = p_schema_schema
  WHERE id = p_schema_id;

  -- Create new version
  v_new_version_number := v_actual_latest_version_number + 1;
  INSERT INTO building_schema_versions (
    building_schema_id,
    number,
    patch,
    reverse_patch,
    organization_id
  ) VALUES (
    p_schema_id,
    v_new_version_number,
    p_schema_version_patch,
    p_schema_version_reverse_patch,
    v_organization_id
  ) RETURNING id INTO v_new_version_id;

  -- Create schema_version message in timeline_items
  INSERT INTO timeline_items (
    design_session_id,
    type,
    content,
    building_schema_version_id,
    organization_id,
    updated_at
  ) VALUES (
    v_design_session_id,
    'schema_version',
    p_message_content,
    v_new_version_id,
    v_organization_id,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_new_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'versionId', v_new_version_id,
    'messageId', v_new_message_id
  );
END;
$$;


ALTER FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_workflow_executions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_workflow_executions_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "artifact" "jsonb",
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."building_schema_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "building_schema_id" "uuid" NOT NULL,
    "number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "patch" "jsonb" NOT NULL,
    "reverse_patch" "jsonb" NOT NULL
);


ALTER TABLE "public"."building_schema_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."building_schemas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "schema" "jsonb" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "git_sha" "text",
    "initial_schema_snapshot" "jsonb",
    "schema_file_path" "text"
);


ALTER TABLE "public"."building_schemas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."design_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "parent_design_session_id" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "design_sessions_project_or_org_check" CHECK ((("project_id" IS NOT NULL) OR ("organization_id" IS NOT NULL)))
);


ALTER TABLE "public"."design_sessions" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "embedding" "public"."vector"(1536),
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."timeline_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "building_schema_version_id" "uuid",
    "type" "public"."timeline_item_type_enum" NOT NULL
);


ALTER TABLE "public"."timeline_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."validation_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "query_string" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."validation_queries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."validation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "validation_query_id" "uuid" NOT NULL,
    "result_set" "jsonb"[],
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "validation_results_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failure'::"text"])))
);


ALTER TABLE "public"."validation_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "status" "public"."execution_status_enum" DEFAULT 'idle'::"public"."execution_status_enum" NOT NULL,
    "workflow_type" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_design_session_id_unique" UNIQUE ("design_session_id");



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_design_session_id_key" UNIQUE ("design_session_id");



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."timeline_items"
    ADD CONSTRAINT "timeline_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");



CREATE INDEX "building_schema_versions_building_schema_id_idx" ON "public"."building_schema_versions" USING "btree" ("building_schema_id");



CREATE INDEX "building_schema_versions_number_idx" ON "public"."building_schema_versions" USING "btree" ("number");



CREATE UNIQUE INDEX "doc_file_path_path_project_id_key" ON "public"."doc_file_paths" USING "btree" ("path", "project_id");



CREATE INDEX "documents_embedding_idx" ON "public"."documents" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE UNIQUE INDEX "github_pull_request_repository_id_pull_number_key" ON "public"."github_pull_requests" USING "btree" ("repository_id", "pull_number");



CREATE UNIQUE INDEX "github_repository_owner_name_organization_id_key" ON "public"."github_repositories" USING "btree" ("owner", "name", "organization_id");



CREATE INDEX "idx_artifacts_design_session_created" ON "public"."artifacts" USING "btree" ("design_session_id", "created_at" DESC);



CREATE INDEX "idx_building_schemas_design_session_created" ON "public"."building_schemas" USING "btree" ("design_session_id", "created_at" DESC);



CREATE INDEX "idx_messages_design_session_created_at" ON "public"."timeline_items" USING "btree" ("design_session_id", "created_at" DESC);



CREATE INDEX "idx_messages_user_id_created_at" ON "public"."timeline_items" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_project_organization_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_review_feedback_comment_review_feedback_id" ON "public"."review_feedback_comments" USING "btree" ("review_feedback_id");



CREATE INDEX "idx_workflow_executions_design_session_id" ON "public"."workflow_executions" USING "btree" ("design_session_id");



CREATE INDEX "idx_workflow_executions_organization_id" ON "public"."workflow_executions" USING "btree" ("organization_id");



CREATE INDEX "idx_workflow_executions_started_at" ON "public"."workflow_executions" USING "btree" ("started_at");



CREATE INDEX "idx_workflow_executions_status" ON "public"."workflow_executions" USING "btree" ("status");



CREATE INDEX "invitations_email_idx" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "invitations_organization_id_idx" ON "public"."invitations" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "knowledge_suggestion_doc_mapping_unique_mapping" ON "public"."knowledge_suggestion_doc_mappings" USING "btree" ("knowledge_suggestion_id", "doc_file_path_id");



CREATE INDEX "organization_member_organization_id_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organization_member_user_id_idx" ON "public"."organization_members" USING "btree" ("user_id");



CREATE UNIQUE INDEX "overall_review_knowledge_suggestion_mapping_unique_mapping" ON "public"."overall_review_knowledge_suggestion_mappings" USING "btree" ("overall_review_id", "knowledge_suggestion_id");



CREATE UNIQUE INDEX "project_repository_mapping_project_id_repository_id_key" ON "public"."project_repository_mappings" USING "btree" ("project_id", "repository_id");



CREATE UNIQUE INDEX "schema_file_path_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("path", "project_id");



CREATE UNIQUE INDEX "schema_file_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("project_id");



CREATE INDEX "timeline_items_building_schema_version_id_idx" ON "public"."timeline_items" USING "btree" ("building_schema_version_id");



CREATE INDEX "validation_queries_design_session_id_idx" ON "public"."validation_queries" USING "btree" ("design_session_id");



CREATE INDEX "validation_queries_organization_id_idx" ON "public"."validation_queries" USING "btree" ("organization_id");



CREATE INDEX "validation_results_executed_at_idx" ON "public"."validation_results" USING "btree" ("executed_at");



CREATE INDEX "validation_results_organization_id_idx" ON "public"."validation_results" USING "btree" ("organization_id");



CREATE INDEX "validation_results_validation_query_id_idx" ON "public"."validation_results" USING "btree" ("validation_query_id");



CREATE OR REPLACE TRIGGER "check_last_organization_member" BEFORE DELETE ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_delete_last_organization_member"();



COMMENT ON TRIGGER "check_last_organization_member" ON "public"."organization_members" IS 'Prevents deletion of the last member of an organization to ensure organizations always have at least one member';



CREATE OR REPLACE TRIGGER "set_artifacts_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_artifacts_organization_id"();



CREATE OR REPLACE TRIGGER "set_building_schema_versions_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."building_schema_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_building_schema_versions_organization_id"();



CREATE OR REPLACE TRIGGER "set_building_schemas_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."building_schemas" FOR EACH ROW EXECUTE FUNCTION "public"."set_building_schemas_organization_id"();



CREATE OR REPLACE TRIGGER "set_design_sessions_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."design_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_design_sessions_organization_id"();



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



CREATE OR REPLACE TRIGGER "set_timeline_items_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."timeline_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_timeline_items_organization_id"();



CREATE OR REPLACE TRIGGER "set_validation_queries_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."validation_queries" FOR EACH ROW EXECUTE FUNCTION "public"."set_validation_queries_organization_id"();



CREATE OR REPLACE TRIGGER "set_validation_results_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."validation_results" FOR EACH ROW EXECUTE FUNCTION "public"."set_validation_results_organization_id"();



CREATE OR REPLACE TRIGGER "trigger_workflow_executions_updated_at" BEFORE UPDATE ON "public"."workflow_executions" FOR EACH ROW EXECUTE FUNCTION "public"."update_workflow_executions_updated_at"();



CREATE OR REPLACE TRIGGER "update_artifacts_updated_at_trigger" BEFORE UPDATE ON "public"."artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_artifacts_updated_at"();



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_building_schema_id_fkey" FOREIGN KEY ("building_schema_id") REFERENCES "public"."building_schemas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_parent_design_session_id_fkey" FOREIGN KEY ("parent_design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."doc_file_paths"
    ADD CONSTRAINT "doc_file_paths_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."timeline_items"
    ADD CONSTRAINT "timeline_items_building_schema_version_id_fkey" FOREIGN KEY ("building_schema_version_id") REFERENCES "public"."building_schema_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timeline_items"
    ADD CONSTRAINT "timeline_items_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timeline_items"
    ADD CONSTRAINT "timeline_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."timeline_items"
    ADD CONSTRAINT "timeline_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."validation_queries"
    ADD CONSTRAINT "validation_queries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."validation_results"
    ADD CONSTRAINT "validation_results_validation_query_id_fkey" FOREIGN KEY ("validation_query_id") REFERENCES "public"."validation_queries"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE "public"."artifacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_delete_org_artifacts" ON "public"."artifacts" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_artifacts" ON "public"."artifacts" IS 'Authenticated users can only delete artifacts in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_building_schema_versions" ON "public"."building_schema_versions" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_delete_org_building_schemas" ON "public"."building_schemas" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only delete building schemas in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_design_sessions" ON "public"."design_sessions" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only delete design sessions in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_documents" ON "public"."documents" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_documents" ON "public"."documents" IS 'Authenticated users can only delete documents in organizations they are members of';



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



CREATE POLICY "authenticated_users_can_delete_org_validation_queries" ON "public"."validation_queries" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_validation_queries" ON "public"."validation_queries" IS 'Authenticated users can only delete validation queries in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_validation_results" ON "public"."validation_results" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_validation_results" ON "public"."validation_results" IS 'Authenticated users can only delete validation results in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_artifacts" ON "public"."artifacts" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_artifacts" ON "public"."artifacts" IS 'Authenticated users can only create artifacts in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_building_schema_versions" ON "public"."building_schema_versions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_building_schemas" ON "public"."building_schemas" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only create building schemas in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_design_sessions" ON "public"."design_sessions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only create design sessions in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_doc_file_paths" ON "public"."doc_file_paths" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_doc_file_paths" ON "public"."doc_file_paths" IS 'Authenticated users can insert doc file paths for their organization';



CREATE POLICY "authenticated_users_can_insert_org_documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_documents" ON "public"."documents" IS 'Authenticated users can only add documents to organizations they are members of';



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



CREATE POLICY "authenticated_users_can_insert_org_timeline_items" ON "public"."timeline_items" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_timeline_items" ON "public"."timeline_items" IS 'Authenticated users can only create timeline items in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_validation_queries" ON "public"."validation_queries" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_validation_queries" ON "public"."validation_queries" IS 'Authenticated users can only create validation queries in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_validation_results" ON "public"."validation_results" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_validation_results" ON "public"."validation_results" IS 'Authenticated users can only create validation results in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" IS 'Authenticated users can create any organization';



CREATE POLICY "authenticated_users_can_insert_projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_projects" ON "public"."projects" IS 'Authenticated users can create any project';



CREATE POLICY "authenticated_users_can_select_org_artifacts" ON "public"."artifacts" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_artifacts" ON "public"."artifacts" IS 'Authenticated users can only view artifacts belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_building_schema_versions" ON "public"."building_schema_versions" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_building_schemas" ON "public"."building_schemas" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only view building schemas belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_design_sessions" ON "public"."design_sessions" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only view design sessions belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_doc_file_paths" ON "public"."doc_file_paths" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_doc_file_paths" ON "public"."doc_file_paths" IS 'Authenticated users can select doc file paths for their organization';



CREATE POLICY "authenticated_users_can_select_org_documents" ON "public"."documents" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_documents" ON "public"."documents" IS 'Authenticated users can only view documents in organizations they are members of';



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



CREATE POLICY "authenticated_users_can_select_org_timeline_items" ON "public"."timeline_items" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_timeline_items" ON "public"."timeline_items" IS 'Authenticated users can only view timeline items belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_validation_queries" ON "public"."validation_queries" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_validation_queries" ON "public"."validation_queries" IS 'Authenticated users can only view validation queries belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_validation_results" ON "public"."validation_results" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_validation_results" ON "public"."validation_results" IS 'Authenticated users can only view validation results belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_artifacts" ON "public"."artifacts" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_artifacts" ON "public"."artifacts" IS 'Authenticated users can only update artifacts in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_building_schema_versions" ON "public"."building_schema_versions" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_update_org_building_schemas" ON "public"."building_schemas" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only update building schemas in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_design_sessions" ON "public"."design_sessions" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only update design sessions in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_documents" ON "public"."documents" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_documents" ON "public"."documents" IS 'Authenticated users can only update documents in organizations they are members of';



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



CREATE POLICY "authenticated_users_can_update_org_timeline_items" ON "public"."timeline_items" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_timeline_items" ON "public"."timeline_items" IS 'Authenticated users can only update timeline items in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_validation_queries" ON "public"."validation_queries" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_validation_queries" ON "public"."validation_queries" IS 'Authenticated users can only update validation queries in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_validation_results" ON "public"."validation_results" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_validation_results" ON "public"."validation_results" IS 'Authenticated users can only update validation results in organizations they are members of';



ALTER TABLE "public"."building_schema_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."building_schemas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."design_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."doc_file_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


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


CREATE POLICY "service_role_can_delete_all_artifacts" ON "public"."artifacts" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_building_schemas" ON "public"."building_schemas" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_documents" ON "public"."documents" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_invitations" ON "public"."invitations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_organizations" ON "public"."organizations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_projects" ON "public"."projects" FOR DELETE TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_delete_all_projects" ON "public"."projects" IS 'Service role can delete any project (for jobs)';



CREATE POLICY "service_role_can_delete_all_validation_queries" ON "public"."validation_queries" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_validation_results" ON "public"."validation_results" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_insert_all_artifacts" ON "public"."artifacts" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_building_schemas" ON "public"."building_schemas" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_design_sessions" ON "public"."design_sessions" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_documents" ON "public"."documents" FOR INSERT TO "service_role" WITH CHECK (true);



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



CREATE POLICY "service_role_can_insert_all_timeline_items" ON "public"."timeline_items" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_validation_queries" ON "public"."validation_queries" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_validation_results" ON "public"."validation_results" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_select_all_artifacts" ON "public"."artifacts" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_building_schemas" ON "public"."building_schemas" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_design_sessions" ON "public"."design_sessions" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_doc_file_paths" ON "public"."doc_file_paths" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_documents" ON "public"."documents" FOR SELECT TO "service_role" USING (true);



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



CREATE POLICY "service_role_can_select_all_timeline_items" ON "public"."timeline_items" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_validation_queries" ON "public"."validation_queries" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_validation_results" ON "public"."validation_results" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_update_all_artifacts" ON "public"."artifacts" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_building_schemas" ON "public"."building_schemas" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_design_sessions" ON "public"."design_sessions" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_documents" ON "public"."documents" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_invitations" ON "public"."invitations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_knowledge_suggestions" ON "public"."knowledge_suggestions" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_migrations" ON "public"."migrations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_organizations" ON "public"."organizations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_projects" ON "public"."projects" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_can_update_all_projects" ON "public"."projects" IS 'Service role can update any project (for jobs)';



CREATE POLICY "service_role_can_update_all_timeline_items" ON "public"."timeline_items" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_validation_queries" ON "public"."validation_queries" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_validation_results" ON "public"."validation_results" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."timeline_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_same_organization_select_policy" ON "public"."users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."organization_members" "om1"
     JOIN "public"."organization_members" "om2" ON (("om1"."organization_id" = "om2"."organization_id")))
  WHERE (("om1"."user_id" = "users"."id") AND ("om2"."user_id" = "auth"."uid"())))) OR ("id" = "auth"."uid"())));



ALTER TABLE "public"."validation_queries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."validation_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflow_executions_delete_policy" ON "public"."workflow_executions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "workflow_executions"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow_executions_insert_policy" ON "public"."workflow_executions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "workflow_executions"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow_executions_select_policy" ON "public"."workflow_executions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "workflow_executions"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow_executions_update_policy" ON "public"."workflow_executions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "workflow_executions"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."artifacts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."building_schemas";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."timeline_items";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("filter" "jsonb", "match_count" integer, "query_embedding" "public"."vector", "match_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("filter" "jsonb", "match_count" integer, "query_embedding" "public"."vector", "match_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("filter" "jsonb", "match_count" integer, "query_embedding" "public"."vector", "match_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_artifacts_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_building_schema_versions_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_building_schema_versions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_building_schema_versions_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timeline_items_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_validation_queries_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_validation_results_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_artifacts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_workflow_executions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_workflow_executions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_workflow_executions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."artifacts" TO "anon";
GRANT ALL ON TABLE "public"."artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."building_schema_versions" TO "anon";
GRANT ALL ON TABLE "public"."building_schema_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."building_schema_versions" TO "service_role";



GRANT ALL ON TABLE "public"."building_schemas" TO "anon";
GRANT ALL ON TABLE "public"."building_schemas" TO "authenticated";
GRANT ALL ON TABLE "public"."building_schemas" TO "service_role";



GRANT ALL ON TABLE "public"."design_sessions" TO "anon";
GRANT ALL ON TABLE "public"."design_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."design_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."doc_file_paths" TO "anon";
GRANT ALL ON TABLE "public"."doc_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."doc_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



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



GRANT ALL ON TABLE "public"."timeline_items" TO "anon";
GRANT ALL ON TABLE "public"."timeline_items" TO "authenticated";
GRANT ALL ON TABLE "public"."timeline_items" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."validation_queries" TO "anon";
GRANT ALL ON TABLE "public"."validation_queries" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_queries" TO "service_role";



GRANT ALL ON TABLE "public"."validation_results" TO "anon";
GRANT ALL ON TABLE "public"."validation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."validation_results" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";









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
