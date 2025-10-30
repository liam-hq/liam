

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






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."assistant_role_enum" AS ENUM (
    'db',
    'pm',
    'qa'
);


ALTER TYPE "public"."assistant_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."schema_format_enum" AS ENUM (
    'schemarb',
    'postgres',
    'prisma',
    'tbls'
);


ALTER TYPE "public"."schema_format_enum" OWNER TO "postgres";


CREATE TYPE "public"."workflow_run_status" AS ENUM (
    'running',
    'completed',
    'error'
);


ALTER TYPE "public"."workflow_run_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_user_id uuid;
  v_organization_id uuid;
  v_invitation_id uuid;
  v_result jsonb;
begin
  begin
    v_user_id := auth.uid();

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

    insert into organization_members (
      user_id,
      organization_id,
      joined_at
    ) values (
      v_user_id,
      v_organization_id,
      current_timestamp
    );

    delete from invitations
    where id = v_invitation_id;

    v_result := jsonb_build_object(
      'success', true,
      'organizationId', v_organization_id,
      'error', null
    );
    return v_result;
  exception when others then
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
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_result jsonb;
  v_project_id uuid;
  v_repository_id uuid;
  v_now timestamp;
begin
  begin
    v_now := now();
    
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

    v_result := jsonb_build_object(
      'success', true,
      'project_id', v_project_id,
      'repository_id', v_repository_id
    );
    return v_result;
    
  exception when others then
    v_result := jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
    return v_result;
  end;
end;
$$;


ALTER FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_run_event_to_runs"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  effective_timestamp timestamptz;
BEGIN
  effective_timestamp := COALESCE(NEW.created_at, now());

  UPDATE public.runs
  SET ended_at = CASE
        WHEN NEW.status IN ('completed', 'error') THEN effective_timestamp
        ELSE ended_at
      END
  WHERE id = NEW.run_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."apply_run_event_to_runs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_latest_session_runs"("session_ids" "uuid"[]) RETURNS TABLE("design_session_id" "uuid", "latest_run_id" "uuid", "status" "public"."workflow_run_status")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with latest_runs as (
    select
      r.design_session_id,
      r.id as run_id,
      row_number() over (partition by r.design_session_id order by r.started_at desc) as run_rank
    from runs r
    where r.design_session_id = any(session_ids)
  ),
  latest_events as (
    select distinct on (re.run_id)
      re.run_id,
      re.status
    from run_events re
    join latest_runs lr on lr.run_id = re.run_id
    order by re.run_id, re.created_at desc, re.id desc
  )
  select
    lr.design_session_id,
    lr.run_id as latest_run_id,
    coalesce(le.status, 'running') as status
  from latest_runs lr
  left join latest_events le on le.run_id = lr.run_id
  where lr.run_rank = 1;
$$;


ALTER FUNCTION "public"."fetch_latest_session_runs"("session_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invitation_data"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_user_id uuid;
  v_organization_name text;
  v_result jsonb;
begin
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
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_metadata_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  UPDATE public.users 
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_metadata_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_is_member boolean;
  v_invite_by_user_id uuid;
  v_existing_invite_id uuid;
  v_new_token uuid;
  v_result jsonb;
begin
  begin
    v_invite_by_user_id := auth.uid();

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

    select id into v_existing_invite_id
    from invitations
    where organization_id = p_organization_id
    and lower(email) = lower(p_email)
    limit 1;
    
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
    
    return v_result;
  exception when others then
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
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM organization_members WHERE organization_id = OLD.organization_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last member of an organization';
  END IF;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_delete_last_organization_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."put_checkpoint"("p_checkpoint" "jsonb", "p_blobs" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into checkpoints (
    thread_id,
    checkpoint_ns,
    checkpoint_id,
    parent_checkpoint_id,
    checkpoint,
    metadata,
    organization_id,
    created_at,
    updated_at
  ) values (
    (p_checkpoint->>'thread_id')::text,
    (p_checkpoint->>'checkpoint_ns')::text,
    (p_checkpoint->>'checkpoint_id')::text,
    (p_checkpoint->>'parent_checkpoint_id')::text,
    p_checkpoint->'checkpoint',
    p_checkpoint->'metadata',
    (p_checkpoint->>'organization_id')::uuid,
    (p_checkpoint->>'created_at')::timestamptz,
    (p_checkpoint->>'updated_at')::timestamptz
  )
  on conflict (thread_id, checkpoint_ns, checkpoint_id, organization_id)
  do update set
    parent_checkpoint_id = excluded.parent_checkpoint_id,
    checkpoint = excluded.checkpoint,
    metadata = excluded.metadata,
    updated_at = excluded.updated_at;

  if p_blobs is not null and jsonb_array_length(p_blobs) > 0 then
    insert into checkpoint_blobs (
      thread_id,
      checkpoint_ns,
      channel,
      version,
      type,
      blob,
      organization_id
    )
    select
      (blob->>'thread_id')::text,
      (blob->>'checkpoint_ns')::text,
      (blob->>'channel')::text,
      (blob->>'version')::text,
      (blob->>'type')::text,
      case
        when blob->>'blob' is null then null
        else decode(blob->>'blob', 'base64')
      end,
      (blob->>'organization_id')::uuid
    from jsonb_array_elements(p_blobs) as blob
    on conflict (thread_id, checkpoint_ns, channel, version, organization_id)
    do update set
      type = excluded.type,
      blob = excluded.blob;
  end if;
end;
$$;


ALTER FUNCTION "public"."put_checkpoint"("p_checkpoint" "jsonb", "p_blobs" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_building_schema_versions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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
    SET "search_path" TO 'public', 'pg_temp'
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
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    NEW.organization_id := (
      SELECT organization_id
      FROM public.projects
      WHERE id = NEW.project_id
    );
  ELSIF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id must be provided when project_id is NULL';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_design_sessions_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_project_repository_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


CREATE OR REPLACE FUNCTION "public"."set_run_events_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  org_id uuid;
BEGIN
  IF NEW.run_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id
  INTO org_id
  FROM public.runs
  WHERE id = NEW.run_id;

  IF org_id IS NOT NULL THEN
    NEW.organization_id := org_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_run_events_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_runs_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  org_id uuid;
BEGIN
  IF NEW.design_session_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id
  INTO org_id
  FROM public.design_sessions
  WHERE id = NEW.design_session_id;

  IF org_id IS NOT NULL THEN
    NEW.organization_id := org_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_runs_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_schema_file_paths_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


CREATE OR REPLACE FUNCTION "public"."sync_existing_users"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


CREATE OR REPLACE FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_new_version_id uuid;
  v_design_session_id uuid;
  v_organization_id uuid;
  v_new_version_number integer;
  v_actual_latest_version_number integer;
begin
  select coalesce(max(number), 0) into v_actual_latest_version_number
  from building_schema_versions
  where building_schema_id = p_schema_id;

  if v_actual_latest_version_number != p_latest_schema_version_number then
    return jsonb_build_object(
      'success', false,
      'error', 'VERSION_CONFLICT',
      'message', format('Version conflict: expected version %s but current version is %s',
                       p_latest_schema_version_number, v_actual_latest_version_number)
    );
  end if;

  select design_session_id, organization_id
  into v_design_session_id, v_organization_id
  from building_schemas
  where id = p_schema_id;

  if v_design_session_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'SCHEMA_NOT_FOUND',
      'message', 'Building schema not found'
    );
  end if;

  update building_schemas
  set schema = p_schema_schema
  where id = p_schema_id;

  v_new_version_number := v_actual_latest_version_number + 1;
  insert into building_schema_versions (
    building_schema_id,
    number,
    patch,
    reverse_patch,
    organization_id
  ) values (
    p_schema_id,
    v_new_version_number,
    p_schema_version_patch,
    p_schema_version_reverse_patch,
    v_organization_id
  ) returning id into v_new_version_id;

  return jsonb_build_object(
    'success', true,
    'versionId', v_new_version_id
  );
end;
$$;


ALTER FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_checkpoints_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_checkpoints_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."building_schema_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "building_schema_id" "uuid" NOT NULL,
    "number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "patch" "jsonb",
    "reverse_patch" "jsonb"
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


COMMENT ON TABLE "public"."building_schemas" IS 'Building schemas with tables, enums, and extensions information stored as JSONB';



CREATE TABLE IF NOT EXISTS "public"."checkpoint_blobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "channel" "text" NOT NULL,
    "version" "text" NOT NULL,
    "type" "text" NOT NULL,
    "blob" "bytea",
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkpoint_blobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoint_blobs" IS 'Stores channel values (state data) for checkpoints';



COMMENT ON COLUMN "public"."checkpoint_blobs"."channel" IS 'Name of the channel containing state data';



COMMENT ON COLUMN "public"."checkpoint_blobs"."version" IS 'Version number for channel value tracking';



COMMENT ON COLUMN "public"."checkpoint_blobs"."type" IS 'Type hint for deserialization';



COMMENT ON COLUMN "public"."checkpoint_blobs"."blob" IS 'Binary serialized data';



CREATE TABLE IF NOT EXISTS "public"."checkpoint_writes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "task_id" "text" NOT NULL,
    "idx" integer NOT NULL,
    "channel" "text" NOT NULL,
    "type" "text",
    "blob" "bytea" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkpoint_writes" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoint_writes" IS 'Stores pending write operations for checkpoints';



COMMENT ON COLUMN "public"."checkpoint_writes"."task_id" IS 'Identifier of the task that generated this write';



COMMENT ON COLUMN "public"."checkpoint_writes"."idx" IS 'Index for ordering multiple writes from the same task';



COMMENT ON COLUMN "public"."checkpoint_writes"."channel" IS 'Target channel for the write operation';



CREATE TABLE IF NOT EXISTS "public"."checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "parent_checkpoint_id" "text",
    "checkpoint" "jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkpoints" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoints" IS 'Stores LangGraph checkpoint metadata for workflow state persistence';



COMMENT ON COLUMN "public"."checkpoints"."thread_id" IS 'Unique identifier for the workflow thread';



COMMENT ON COLUMN "public"."checkpoints"."checkpoint_ns" IS 'Namespace for checkpoint isolation within a thread';



COMMENT ON COLUMN "public"."checkpoints"."checkpoint_id" IS 'Unique identifier for this checkpoint';



COMMENT ON COLUMN "public"."checkpoints"."parent_checkpoint_id" IS 'Reference to parent checkpoint for version history';



COMMENT ON COLUMN "public"."checkpoints"."checkpoint" IS 'Serialized checkpoint data including versions and metadata';



COMMENT ON COLUMN "public"."checkpoints"."metadata" IS 'Custom metadata attached to the checkpoint';



COMMENT ON COLUMN "public"."checkpoints"."organization_id" IS 'Organization ID for multi-tenant isolation';



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
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_share_settings" (
    "design_session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."public_share_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."run_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "public"."workflow_run_status" NOT NULL,
    "created_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."run_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."run_events" IS 'Immutable log of workflow run state transitions. Each insert captures a new status event for a run.';



COMMENT ON COLUMN "public"."run_events"."run_id" IS 'Foreign key to the run this event belongs to.';



COMMENT ON COLUMN "public"."run_events"."organization_id" IS 'Organization copied from the parent run for multi-tenant scoping.';



COMMENT ON COLUMN "public"."run_events"."status" IS 'Workflow status captured by this event (running, completed, error).';



COMMENT ON COLUMN "public"."run_events"."created_by_user_id" IS 'User that recorded the event (if applicable).';



COMMENT ON COLUMN "public"."run_events"."created_at" IS 'Timestamp when the event was recorded.';



CREATE TABLE IF NOT EXISTS "public"."runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "design_session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone
);


ALTER TABLE "public"."runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."runs" IS 'Current workflow run per design session (1:1). Updated via run_events trigger to reflect the latest lifecycle state.';



COMMENT ON COLUMN "public"."runs"."id" IS 'Unique identifier for the run record associated with a design session.';



COMMENT ON COLUMN "public"."runs"."design_session_id" IS 'Design session owning this run record (enforced unique to keep 1:1).';



COMMENT ON COLUMN "public"."runs"."organization_id" IS 'Organization scope for the run; auto-populated from the design session.';



COMMENT ON COLUMN "public"."runs"."created_by_user_id" IS 'User that initiated or last restarted the workflow run.';



COMMENT ON COLUMN "public"."runs"."started_at" IS 'Timestamp when the run started (defaults to insertion time).';



COMMENT ON COLUMN "public"."runs"."ended_at" IS 'Timestamp of the most recent terminal event (completed or error).';



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


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_design_session_id_key" UNIQUE ("design_session_id");



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_blobs"
    ADD CONSTRAINT "checkpoint_blobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_blobs"
    ADD CONSTRAINT "checkpoint_blobs_thread_id_checkpoint_ns_channel_version_or_key" UNIQUE ("thread_id", "checkpoint_ns", "channel", "version", "organization_id");



ALTER TABLE ONLY "public"."checkpoint_writes"
    ADD CONSTRAINT "checkpoint_writes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_writes"
    ADD CONSTRAINT "checkpoint_writes_thread_id_checkpoint_ns_checkpoint_id_tas_key" UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx", "organization_id");



ALTER TABLE ONLY "public"."checkpoints"
    ADD CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoints"
    ADD CONSTRAINT "checkpoints_thread_id_checkpoint_ns_checkpoint_id_organizat_key" UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id", "organization_id");



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repository_github_repository_identifier_organization_id_" UNIQUE ("github_repository_identifier", "organization_id");



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "github_schema_file_path_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_share_settings"
    ADD CONSTRAINT "public_share_settings_pkey" PRIMARY KEY ("design_session_id");



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "repository_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."run_events"
    ADD CONSTRAINT "run_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_design_session_id_key" UNIQUE ("design_session_id");



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



CREATE INDEX "building_schema_versions_building_schema_id_idx" ON "public"."building_schema_versions" USING "btree" ("building_schema_id");



CREATE INDEX "building_schema_versions_number_idx" ON "public"."building_schema_versions" USING "btree" ("number");



CREATE UNIQUE INDEX "github_repository_owner_name_organization_id_key" ON "public"."github_repositories" USING "btree" ("owner", "name", "organization_id");



CREATE INDEX "idx_building_schemas_design_session_created" ON "public"."building_schemas" USING "btree" ("design_session_id", "created_at" DESC);



CREATE INDEX "idx_checkpoint_blobs_organization_id" ON "public"."checkpoint_blobs" USING "btree" ("organization_id");



CREATE INDEX "idx_checkpoint_blobs_thread_id" ON "public"."checkpoint_blobs" USING "btree" ("thread_id", "checkpoint_ns");



CREATE INDEX "idx_checkpoint_writes_checkpoint" ON "public"."checkpoint_writes" USING "btree" ("thread_id", "checkpoint_ns", "checkpoint_id");



CREATE INDEX "idx_checkpoint_writes_organization_id" ON "public"."checkpoint_writes" USING "btree" ("organization_id");



CREATE INDEX "idx_checkpoint_writes_task" ON "public"."checkpoint_writes" USING "btree" ("task_id");



CREATE INDEX "idx_checkpoints_created_at" ON "public"."checkpoints" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_checkpoints_organization_id" ON "public"."checkpoints" USING "btree" ("organization_id");



CREATE INDEX "idx_checkpoints_parent" ON "public"."checkpoints" USING "btree" ("parent_checkpoint_id") WHERE ("parent_checkpoint_id" IS NOT NULL);



CREATE INDEX "idx_checkpoints_thread_id" ON "public"."checkpoints" USING "btree" ("thread_id", "checkpoint_ns");



CREATE INDEX "idx_project_organization_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_public_share_settings_created_at" ON "public"."public_share_settings" USING "btree" ("created_at");



CREATE INDEX "invitations_email_idx" ON "public"."invitations" USING "btree" ("email");



CREATE INDEX "invitations_organization_id_idx" ON "public"."invitations" USING "btree" ("organization_id");



CREATE INDEX "organization_member_organization_id_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organization_member_user_id_idx" ON "public"."organization_members" USING "btree" ("user_id");



CREATE UNIQUE INDEX "project_repository_mapping_project_id_repository_id_key" ON "public"."project_repository_mappings" USING "btree" ("project_id", "repository_id");



CREATE INDEX "run_events_organization_id_idx" ON "public"."run_events" USING "btree" ("organization_id");



CREATE INDEX "run_events_run_id_created_at_idx" ON "public"."run_events" USING "btree" ("run_id", "created_at" DESC);



CREATE INDEX "runs_design_session_id_idx" ON "public"."runs" USING "btree" ("design_session_id");



CREATE INDEX "runs_organization_id_idx" ON "public"."runs" USING "btree" ("organization_id");



CREATE UNIQUE INDEX "schema_file_path_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("path", "project_id");



CREATE UNIQUE INDEX "schema_file_path_project_id_key" ON "public"."schema_file_paths" USING "btree" ("project_id");



CREATE OR REPLACE TRIGGER "apply_run_event_to_runs_trigger" AFTER INSERT ON "public"."run_events" FOR EACH ROW EXECUTE FUNCTION "public"."apply_run_event_to_runs"();



CREATE OR REPLACE TRIGGER "check_last_organization_member" BEFORE DELETE ON "public"."organization_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_delete_last_organization_member"();



COMMENT ON TRIGGER "check_last_organization_member" ON "public"."organization_members" IS 'Prevents deletion of the last member of an organization to ensure organizations always have at least one member';



CREATE OR REPLACE TRIGGER "set_building_schema_versions_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."building_schema_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_building_schema_versions_organization_id"();



CREATE OR REPLACE TRIGGER "set_building_schemas_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."building_schemas" FOR EACH ROW EXECUTE FUNCTION "public"."set_building_schemas_organization_id"();



CREATE OR REPLACE TRIGGER "set_design_sessions_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."design_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_design_sessions_organization_id"();



CREATE OR REPLACE TRIGGER "set_project_repository_mappings_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."project_repository_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."set_project_repository_mappings_organization_id"();



CREATE OR REPLACE TRIGGER "set_run_events_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."run_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_run_events_organization_id"();



CREATE OR REPLACE TRIGGER "set_runs_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."runs" FOR EACH ROW EXECUTE FUNCTION "public"."set_runs_organization_id"();



CREATE OR REPLACE TRIGGER "set_schema_file_paths_organization_id_trigger" BEFORE INSERT OR UPDATE ON "public"."schema_file_paths" FOR EACH ROW EXECUTE FUNCTION "public"."set_schema_file_paths_organization_id"();



CREATE OR REPLACE TRIGGER "update_checkpoints_updated_at_trigger" BEFORE UPDATE ON "public"."checkpoints" FOR EACH ROW EXECUTE FUNCTION "public"."update_checkpoints_updated_at"();



ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_building_schema_id_fkey" FOREIGN KEY ("building_schema_id") REFERENCES "public"."building_schemas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schema_versions"
    ADD CONSTRAINT "building_schema_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_schemas"
    ADD CONSTRAINT "building_schemas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."checkpoint_blobs"
    ADD CONSTRAINT "checkpoint_blobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."checkpoint_writes"
    ADD CONSTRAINT "checkpoint_writes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."checkpoints"
    ADD CONSTRAINT "checkpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_parent_design_session_id_fkey" FOREIGN KEY ("parent_design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."design_sessions"
    ADD CONSTRAINT "design_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."github_repositories"
    ADD CONSTRAINT "github_repositories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invite_by_user_id_fkey" FOREIGN KEY ("invite_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mapping_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "public"."github_repositories"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."project_repository_mappings"
    ADD CONSTRAINT "project_repository_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."public_share_settings"
    ADD CONSTRAINT "public_share_settings_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."run_events"
    ADD CONSTRAINT "run_events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."run_events"
    ADD CONSTRAINT "run_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."run_events"
    ADD CONSTRAINT "run_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_design_session_id_fkey" FOREIGN KEY ("design_session_id") REFERENCES "public"."design_sessions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "schema_file_path_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schema_file_paths"
    ADD CONSTRAINT "schema_file_paths_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



CREATE POLICY "authenticated_users_can_delete_org_building_schema_versions" ON "public"."building_schema_versions" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_delete_org_building_schemas" ON "public"."building_schemas" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only delete building schemas in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoint_blobs" ON "public"."checkpoint_blobs" IS 'Authenticated users can only delete checkpoint blobs in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_checkpoint_writes" ON "public"."checkpoint_writes" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoint_writes" ON "public"."checkpoint_writes" IS 'Authenticated users can only delete checkpoint writes in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_checkpoints" ON "public"."checkpoints" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoints" ON "public"."checkpoints" IS 'Authenticated users can only delete checkpoints in organizations they are members of';



CREATE POLICY "authenticated_users_can_delete_org_design_sessions" ON "public"."design_sessions" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only delete design sessions in organizations they are members of';



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



CREATE POLICY "authenticated_users_can_delete_org_public_share_settings" ON "public"."public_share_settings" FOR DELETE TO "authenticated" USING (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "authenticated_users_can_delete_org_run_events" ON "public"."run_events" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_run_events" ON "public"."run_events" IS 'Authenticated users can delete run events only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_delete_org_runs" ON "public"."runs" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_delete_org_runs" ON "public"."runs" IS 'Authenticated users can delete runs only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_insert_org_building_schema_versions" ON "public"."building_schema_versions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_building_schemas" ON "public"."building_schemas" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only create building schemas in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoint_blobs" ON "public"."checkpoint_blobs" IS 'Authenticated users can only create checkpoint blobs in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_checkpoint_writes" ON "public"."checkpoint_writes" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoint_writes" ON "public"."checkpoint_writes" IS 'Authenticated users can only create checkpoint writes in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_checkpoints" ON "public"."checkpoints" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoints" ON "public"."checkpoints" IS 'Authenticated users can only create checkpoints in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_design_sessions" ON "public"."design_sessions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only create design sessions in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_github_repositories" ON "public"."github_repositories" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_github_repositories" ON "public"."github_repositories" IS 'Authenticated users can only create repositories in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_invitations" ON "public"."invitations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_insert_org_organization_members" ON "public"."organization_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_current_user_org_member"("organization_id")));



COMMENT ON POLICY "authenticated_users_can_insert_org_organization_members" ON "public"."organization_members" IS 'Authenticated users can add themselves to any organization or add members to organizations they belong to';



CREATE POLICY "authenticated_users_can_insert_org_project_repository_mappings" ON "public"."project_repository_mappings" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_project_repository_mappings" ON "public"."project_repository_mappings" IS 'Authenticated users can only create project repository mappings in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_org_public_share_settings" ON "public"."public_share_settings" FOR INSERT TO "authenticated" WITH CHECK (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "authenticated_users_can_insert_org_run_events" ON "public"."run_events" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_run_events" ON "public"."run_events" IS 'Authenticated users can create run events only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_insert_org_runs" ON "public"."runs" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_runs" ON "public"."runs" IS 'Authenticated users can create runs only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_insert_org_schema_file_paths" ON "public"."schema_file_paths" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only create schema file paths in organizations they are members of';



CREATE POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "authenticated_users_can_insert_organizations" ON "public"."organizations" IS 'Authenticated users can create any organization';



CREATE POLICY "authenticated_users_can_insert_projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_insert_projects" ON "public"."projects" IS 'Authenticated users can create any project';



CREATE POLICY "authenticated_users_can_select_org_building_schema_versions" ON "public"."building_schema_versions" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_building_schemas" ON "public"."building_schemas" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_building_schemas" ON "public"."building_schemas" IS 'Authenticated users can only view building schemas belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_checkpoint_blobs" ON "public"."checkpoint_blobs" IS 'Authenticated users can only view checkpoint blobs belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_checkpoint_writes" ON "public"."checkpoint_writes" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_checkpoint_writes" ON "public"."checkpoint_writes" IS 'Authenticated users can only view checkpoint writes belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_checkpoints" ON "public"."checkpoints" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_checkpoints" ON "public"."checkpoints" IS 'Authenticated users can only view checkpoints belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_design_sessions" ON "public"."design_sessions" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only view design sessions belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_github_repositories" ON "public"."github_repositories" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_github_repositories" ON "public"."github_repositories" IS 'Authenticated users can only view repositories belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_invitations" ON "public"."invitations" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "authenticated_users_can_select_org_organization_members" ON "public"."organization_members" FOR SELECT TO "authenticated" USING ("public"."is_current_user_org_member"("organization_id"));



COMMENT ON POLICY "authenticated_users_can_select_org_organization_members" ON "public"."organization_members" IS 'Authenticated users can only view members of organizations they belong to';



CREATE POLICY "authenticated_users_can_select_org_organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "authenticated_users_can_select_org_organizations" ON "public"."organizations" IS 'Authenticated users can only view organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_project_repository_mappings" ON "public"."project_repository_mappings" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_project_repository_mappings" ON "public"."project_repository_mappings" IS 'Authenticated users can only view project repository mappings belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_projects" ON "public"."projects" IS 'Authenticated users can only view projects belonging to organizations they are members of';



CREATE POLICY "authenticated_users_can_select_org_public_share_settings" ON "public"."public_share_settings" FOR SELECT TO "authenticated" USING (("design_session_id" IN ( SELECT "ds"."id"
   FROM "public"."design_sessions" "ds"
  WHERE ("ds"."organization_id" IN ( SELECT "organization_members"."organization_id"
           FROM "public"."organization_members"
          WHERE ("organization_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "authenticated_users_can_select_org_run_events" ON "public"."run_events" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_run_events" ON "public"."run_events" IS 'Authenticated users can view run events for organizations they belong to.';



CREATE POLICY "authenticated_users_can_select_org_runs" ON "public"."runs" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_runs" ON "public"."runs" IS 'Authenticated users can view runs for organizations they belong to.';



CREATE POLICY "authenticated_users_can_select_org_schema_file_paths" ON "public"."schema_file_paths" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_select_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only view schema file paths belonging to organizations they are members of';



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



CREATE POLICY "authenticated_users_can_update_org_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_checkpoint_blobs" ON "public"."checkpoint_blobs" IS 'Authenticated users can only update checkpoint blobs in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_checkpoint_writes" ON "public"."checkpoint_writes" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_checkpoint_writes" ON "public"."checkpoint_writes" IS 'Authenticated users can only update checkpoint writes in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_checkpoints" ON "public"."checkpoints" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_checkpoints" ON "public"."checkpoints" IS 'Authenticated users can only update checkpoints in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_design_sessions" ON "public"."design_sessions" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_design_sessions" ON "public"."design_sessions" IS 'Authenticated users can only update design sessions in organizations they are members of';



CREATE POLICY "authenticated_users_can_update_org_invitations" ON "public"."invitations" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



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



CREATE POLICY "authenticated_users_can_update_org_run_events" ON "public"."run_events" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_run_events" ON "public"."run_events" IS 'Authenticated users can update run events only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_update_org_runs" ON "public"."runs" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "om"."organization_id"
   FROM "public"."organization_members" "om"
  WHERE ("om"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_runs" ON "public"."runs" IS 'Authenticated users can update runs only inside organizations they belong to.';



CREATE POLICY "authenticated_users_can_update_org_schema_file_paths" ON "public"."schema_file_paths" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE ("organization_members"."user_id" = "auth"."uid"()))));



COMMENT ON POLICY "authenticated_users_can_update_org_schema_file_paths" ON "public"."schema_file_paths" IS 'Authenticated users can only update schema file paths in organizations they are members of';



ALTER TABLE "public"."building_schema_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."building_schemas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_blobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_writes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."design_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."github_repositories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_repository_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_building_schema_versions_read" ON "public"."building_schema_versions" FOR SELECT TO "anon" USING (("building_schema_id" IN ( SELECT "bs"."id"
   FROM "public"."building_schemas" "bs"
  WHERE ("bs"."design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
           FROM "public"."public_share_settings")))));



CREATE POLICY "public_building_schemas_read" ON "public"."building_schemas" FOR SELECT TO "anon" USING (("design_session_id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));



CREATE POLICY "public_sessions_read" ON "public"."design_sessions" FOR SELECT TO "anon" USING (("id" IN ( SELECT "public_share_settings"."design_session_id"
   FROM "public"."public_share_settings")));



ALTER TABLE "public"."public_share_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_share_settings_read" ON "public"."public_share_settings" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."run_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schema_file_paths" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_delete_all_building_schemas" ON "public"."building_schemas" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_checkpoint_writes" ON "public"."checkpoint_writes" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_checkpoints" ON "public"."checkpoints" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_invitations" ON "public"."invitations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_organizations" ON "public"."organizations" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_projects" ON "public"."projects" FOR DELETE TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_delete_all_projects" ON "public"."projects" IS 'Service role can delete any project (for jobs)';



CREATE POLICY "service_role_can_delete_all_run_events" ON "public"."run_events" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_delete_all_runs" ON "public"."runs" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_role_can_insert_all_building_schemas" ON "public"."building_schemas" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_checkpoint_writes" ON "public"."checkpoint_writes" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_checkpoints" ON "public"."checkpoints" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_design_sessions" ON "public"."design_sessions" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_invitations" ON "public"."invitations" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_organizations" ON "public"."organizations" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_projects" ON "public"."projects" FOR INSERT TO "service_role" WITH CHECK (true);



COMMENT ON POLICY "service_role_can_insert_all_projects" ON "public"."projects" IS 'Service role can create any project (for jobs)';



CREATE POLICY "service_role_can_insert_all_run_events" ON "public"."run_events" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_insert_all_runs" ON "public"."runs" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_can_select_all_building_schemas" ON "public"."building_schemas" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_checkpoint_writes" ON "public"."checkpoint_writes" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_checkpoints" ON "public"."checkpoints" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_design_sessions" ON "public"."design_sessions" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_github_repositories" ON "public"."github_repositories" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_invitations" ON "public"."invitations" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_organizations" ON "public"."organizations" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_project_repository_mappings" ON "public"."project_repository_mappings" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_projects" ON "public"."projects" FOR SELECT TO "service_role" USING (true);



COMMENT ON POLICY "service_role_can_select_all_projects" ON "public"."projects" IS 'Service role can view all projects (for jobs)';



CREATE POLICY "service_role_can_select_all_run_events" ON "public"."run_events" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_runs" ON "public"."runs" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_select_all_schema_file_paths" ON "public"."schema_file_paths" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "service_role_can_update_all_building_schemas" ON "public"."building_schemas" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_checkpoint_blobs" ON "public"."checkpoint_blobs" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_checkpoint_writes" ON "public"."checkpoint_writes" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_checkpoints" ON "public"."checkpoints" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_design_sessions" ON "public"."design_sessions" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_invitations" ON "public"."invitations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_organizations" ON "public"."organizations" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_projects" ON "public"."projects" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_can_update_all_projects" ON "public"."projects" IS 'Service role can update any project (for jobs)';



CREATE POLICY "service_role_can_update_all_run_events" ON "public"."run_events" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_update_all_runs" ON "public"."runs" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_same_organization_select_policy" ON "public"."users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."organization_members" "om1"
     JOIN "public"."organization_members" "om2" ON (("om1"."organization_id" = "om2"."organization_id")))
  WHERE (("om1"."user_id" = "users"."id") AND ("om2"."user_id" = "auth"."uid"())))) OR ("id" = "auth"."uid"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."building_schema_versions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."building_schemas";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."run_events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."runs";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_run_event_to_runs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_run_event_to_runs"() TO "service_role";
GRANT ALL ON FUNCTION "public"."apply_run_event_to_runs"() TO "anon";



GRANT ALL ON FUNCTION "public"."fetch_latest_session_runs"("session_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_latest_session_runs"("session_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_data"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_metadata_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_metadata_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_org_member"("_org" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_delete_last_organization_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."put_checkpoint"("p_checkpoint" "jsonb", "p_blobs" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."put_checkpoint"("p_checkpoint" "jsonb", "p_blobs" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_building_schema_versions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_building_schema_versions_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_building_schemas_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_design_sessions_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_project_repository_mappings_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_project_repository_mappings_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_run_events_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_run_events_organization_id"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_run_events_organization_id"() TO "anon";



GRANT ALL ON FUNCTION "public"."set_runs_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_runs_organization_id"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_runs_organization_id"() TO "anon";



GRANT ALL ON FUNCTION "public"."set_schema_file_paths_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_schema_file_paths_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_existing_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_checkpoints_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_checkpoints_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."building_schema_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."building_schema_versions" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT SELECT("building_schema_id") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT SELECT("number") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT SELECT("created_at") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT SELECT("patch") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT SELECT("reverse_patch") ON TABLE "public"."building_schema_versions" TO "anon";



GRANT ALL ON TABLE "public"."building_schemas" TO "authenticated";
GRANT ALL ON TABLE "public"."building_schemas" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("design_session_id") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("schema") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("created_at") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("git_sha") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("initial_schema_snapshot") ON TABLE "public"."building_schemas" TO "anon";



GRANT SELECT("schema_file_path") ON TABLE "public"."building_schemas" TO "anon";



GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_writes" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_writes" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoints" TO "service_role";



GRANT ALL ON TABLE "public"."design_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."design_sessions" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."design_sessions" TO "anon";



GRANT SELECT("parent_design_session_id") ON TABLE "public"."design_sessions" TO "anon";



GRANT SELECT("name") ON TABLE "public"."design_sessions" TO "anon";



GRANT SELECT("created_at") ON TABLE "public"."design_sessions" TO "anon";



GRANT ALL ON TABLE "public"."github_repositories" TO "authenticated";
GRANT ALL ON TABLE "public"."github_repositories" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."project_repository_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."project_repository_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."public_share_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."public_share_settings" TO "service_role";
GRANT SELECT ON TABLE "public"."public_share_settings" TO "anon";



GRANT ALL ON TABLE "public"."run_events" TO "authenticated";
GRANT ALL ON TABLE "public"."run_events" TO "service_role";
GRANT ALL ON TABLE "public"."run_events" TO "anon";



GRANT ALL ON TABLE "public"."runs" TO "authenticated";
GRANT ALL ON TABLE "public"."runs" TO "service_role";
GRANT ALL ON TABLE "public"."runs" TO "anon";



GRANT ALL ON TABLE "public"."schema_file_paths" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_file_paths" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
