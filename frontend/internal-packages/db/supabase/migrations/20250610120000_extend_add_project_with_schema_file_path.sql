drop function if exists add_project(text, text, text, bigint, bigint, uuid);

create or replace function add_project(
  p_project_name text,
  p_repository_name text,
  p_repository_owner text,
  p_installation_id bigint,
  p_repository_identifier bigint,
  p_organization_id uuid,
  p_schema_file_path text,
  p_schema_format schema_format_enum
) returns jsonb as $$
declare
  v_result jsonb;
  v_project_id uuid;
  v_repository_id uuid;
  v_schema_file_path_id uuid;
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

    insert into schema_file_paths (
      path,
      project_id,
      format,
      created_at,
      updated_at
    ) values (
      p_schema_file_path,
      v_project_id,
      p_schema_format,
      v_now,
      v_now
    ) returning id into v_schema_file_path_id;

    v_result := jsonb_build_object(
      'success', true,
      'project_id', v_project_id,
      'repository_id', v_repository_id,
      'schema_file_path_id', v_schema_file_path_id
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
$$ language plpgsql
set search_path to 'public', 'pg_temp';

revoke all on function add_project(text, text, text, bigint, bigint, uuid, text, schema_format_enum) from anon;

grant execute on function add_project(text, text, text, bigint, bigint, uuid, text, schema_format_enum) to authenticated;
grant execute on function add_project(text, text, text, bigint, bigint, uuid, text, schema_format_enum) to service_role;
