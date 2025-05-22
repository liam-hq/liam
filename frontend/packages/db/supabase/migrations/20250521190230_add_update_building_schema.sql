create or replace function update_building_schema(
  p_schema_id uuid,
  p_schema_schema jsonb,
  p_schema_version_patch jsonb,
  p_schema_version_reverse_patch jsonb,
  p_latest_schema_version_number integer
) returns jsonb as $$
declare
  v_result jsonb;
  v_organization_id uuid;
  v_next_version_number integer;
begin
  -- Start transaction
  begin
    -- 1. Select organization_id from building_schemas
    select organization_id into v_organization_id
    from building_schemas
    where id = p_schema_id;
  
    if not found then
      v_result := jsonb_build_object(
        'success', false,
        'error', 'Building schema not found'
      );
      return v_result;
    end if;

    -- Calculate the next version number
    v_next_version_number := p_latest_schema_version_number + 1;

    -- 2. Insert into building_schema_versions
    insert into building_schema_versions (
      organization_id,
      building_schema_id,
      number,
      patch,
      reverse_patch,
      created_at
    ) values (
      v_organization_id,
      p_schema_id,
      v_next_version_number,
      p_schema_version_patch,
      p_schema_version_reverse_patch,
      now()
    );

    -- 3. Update building_schemas with the new schema
    update building_schemas
    set schema = p_schema_schema
    where id = p_schema_id;

    -- Commit transaction
    v_result := jsonb_build_object(
      'success', true,
      'versionNumber', v_next_version_number
    );
    return v_result;
  exception when others then
    -- Handle any errors
    v_result := jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
    return v_result;
  end;
end;
$$ language plpgsql;

revoke all on function update_building_schema(uuid, jsonb, jsonb, jsonb, integer) from anon;
