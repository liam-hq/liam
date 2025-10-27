
CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."add_project"("p_project_name" "text", "p_repository_name" "text", "p_repository_owner" "text", "p_installation_id" bigint, "p_repository_identifier" bigint, "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."get_invitation_data"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."invite_organization_member"("p_email" "text", "p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."prevent_delete_last_organization_member"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = public, pg_temp
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM organization_members WHERE organization_id = OLD.organization_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last member of an organization';
  END IF;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."put_checkpoint"("p_checkpoint" "jsonb", "p_blobs" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."set_building_schema_versions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."set_building_schemas_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."set_design_sessions_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."set_project_repository_mappings_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."set_schema_file_paths_organization_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."sync_existing_users"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."update_building_schema"("p_schema_id" "uuid", "p_schema_schema" "jsonb", "p_schema_version_patch" "jsonb", "p_schema_version_reverse_patch" "jsonb", "p_latest_schema_version_number" integer, "p_message_content" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION "public"."update_checkpoints_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET search_path = public, pg_temp
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
