create or replace function add_project(
  p_project_name text,
  p_repository_name text,
  p_repository_owner text,
  p_installation_id bigint,
  p_repository_identifier bigint,
  p_organization_id uuid
) returns jsonb as $$
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
$$ language plpgsql;

-- Revoke access from anonymous users
revoke all on function add_project(text, text, text, bigint, bigint, uuid) from anon;