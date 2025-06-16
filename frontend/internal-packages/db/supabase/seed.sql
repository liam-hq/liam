/*
 * SEED.SQL - Database Initialization Script
 * =========================================
 *
 * Purpose:
 * This script populates the database with initial test data for local and preview environments.
 * It is NOT intended for production use and should only be applied to development or testing databases.
 *
 * Environment Detection:
 * - Automatically detects environment by checking server IP address (inet_server_addr())
 * - Local environment: IP starts with '172.*' (typical for Docker Compose networks)
 * - Preview environment: Any other IP address
 *
 * Key Features:
 * - Creates immediately usable data for UI verification and testing
 * - Provides a pre-configured test user with fixed credentials for easy login:
 *   Email: test@example.com
 *   Password: liampassword1234
 *
 * Installation ID Handling:
 * - GitHub installation IDs differ between local and preview environments:
 *   - Local environment: 63410913
 *   - Preview environment: 63410962
 * - The script automatically applies the appropriate ID based on detected environment
 *
 * Actions for Both Local and Preview Environments:
 * 1. Creates test users (test@example.com, test2@example.com / liampassword1234)
 * 2. Creates an organization (liam-hq)
 * 3. Links the users to the organization
 * 4. Creates a GitHub repository entry for liam-hq/liam with environment-specific installation ID
 * 5. Creates a project named "liam"
 * 6. Links the project to the repository
 * 7. Sets up a schema file path pointing to the schema.sql file
 */
do $$
declare
  server_addr text := inet_server_addr()::text;
  is_local boolean;

  -- variables to store ids
  v_installation_id integer;
  v_org_id uuid;
  v_user_id uuid;
  v_user_id_2 uuid;
  v_repo_id uuid;
  v_project_id uuid;
begin
  -- check if local environment (ipv4 address starting with 172.*)
  -- this is typically the case for docker compose networks
  is_local := server_addr like '172.%';
  -- Set installation_id based on environment
  v_installation_id := case when is_local then 63410913 else 63410962 end;

  raise notice 'server address: %, environment: %',
    server_addr,
    case when is_local then 'local' else 'preview' end;

  -- 1. create test users
  -- First user
  v_user_id := gen_random_uuid();
  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'test@example.com', crypt('liampassword1234', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id::text, 'test@example.com')::jsonb, 'email', now(), now(), now());

  -- Second user
  v_user_id_2 := gen_random_uuid();
  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', v_user_id_2, 'authenticated', 'authenticated', 'test2@example.com', crypt('liampassword1234', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id_2, v_user_id_2, format('{"sub":"%s","email":"%s"}', v_user_id_2::text, 'test2@example.com')::jsonb, 'email', now(), now(), now());

  -- 2. create a single organization
  insert into public.organizations (id, name)
  values
    (gen_random_uuid(), 'liam-hq')
  on conflict (id) do nothing
  returning id into v_org_id;

  -- 3. link users to organization (organization_members table)
  insert into public.organization_members (user_id, organization_id)
  values
    (v_user_id, v_org_id),
    (v_user_id_2, v_org_id)
  on conflict (user_id, organization_id) do nothing;

  -- 4. create a single github repository with environment-specific installation_id
  insert into public.github_repositories (
    name,
    owner,
    github_installation_identifier,
    github_repository_identifier,
    organization_id,
    created_at,
    updated_at
  )
  values (
    'liam',
    'liam-hq',
    v_installation_id, -- Use the environment-specific installation_id
    839216423, -- fixed repository_identifier for liam-hq/liam. `$ curl -s https://api.github.com/repos/liam-hq/liam | jq '.id'`
    v_org_id,
    current_timestamp,
    current_timestamp
  )
  on conflict (github_repository_identifier, organization_id) do nothing
  returning id into v_repo_id;

  -- 5. create a single project
  insert into public.projects (
    name,
    organization_id,
    created_at,
    updated_at
  )
  values (
    'liam',
    v_org_id,
    current_timestamp,
    current_timestamp
  )
  returning id into v_project_id;

  -- 6. link project to repository
  insert into public.project_repository_mappings (
    project_id,
    repository_id,
    created_at,
    updated_at
  )
  values (
    v_project_id,
    v_repo_id,
    current_timestamp,
    current_timestamp
  )
  on conflict (project_id, repository_id) do nothing;

  -- 7. create a schema_file_path
  insert into public.schema_file_paths (
    project_id,
    path,
    format,
    created_at,
    updated_at
  )
  values (
    v_project_id,
    'frontend/internal-packages/db/schema/schema.sql', -- liam's schema file path
    'postgres', -- liam's schema file format
    current_timestamp,
    current_timestamp
  );

  raise notice 'environment: %, seeded database with test data.',
    case when is_local then 'local' else 'preview' end;
  raise notice 'test users created: test@example.com, test2@example.com with password: liampassword1234';
  raise notice 'using installation_id: %', v_installation_id;
end $$;
