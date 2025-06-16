-- Create a function to get invitation data with organization name
create or replace function get_invitation_data(
  p_token uuid
) returns jsonb as $$
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
$$ language plpgsql security definer;

revoke all on function get_invitation_data(uuid) from anon;
