-- Test file for update_building_schema function
BEGIN;

-- Load the pgtap extension
SELECT plan(8);

-- Set role to postgres for preparation
SET ROLE postgres;

-- Create test users
SELECT tests.create_supabase_user('schema_owner@example.com', 'schema_owner');
SELECT tests.create_supabase_user('non_member@example.com', 'non_member');

-- Get user IDs and setup test data
DO $$
DECLARE
    v_owner_id uuid;
    v_org_id uuid := '44444444-4444-4444-4444-444444444444';
    v_design_session_id uuid := '77777777-7777-7777-7777-777777777777';
    v_schema_id uuid := '55555555-5555-5555-5555-555555555555';
    v_non_existent_schema_id uuid := '66666666-6666-6666-6666-666666666666';
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('schema_owner@example.com') INTO v_owner_id;

    -- Create test organization
    INSERT INTO organizations (id, name)
    VALUES (v_org_id, 'Test Org for Building Schema')
    ON CONFLICT DO NOTHING;

    -- Add schema_owner to organization
    INSERT INTO organization_members (user_id, organization_id)
    VALUES (v_owner_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- Create a test project
    INSERT INTO projects (id, name, organization_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Test Project for Building Schema',
        v_org_id,
        now(),
        now()
    )
    ON CONFLICT DO NOTHING;

    -- Create a test design session
    INSERT INTO design_sessions (
        id,
        project_id,
        organization_id,
        created_by_user_id,
        name,
        created_at
    ) VALUES (
        v_design_session_id,
        (SELECT id FROM projects WHERE organization_id = v_org_id LIMIT 1),
        v_org_id,
        v_owner_id,
        'Test Design Session',
        now() - interval '2 days'
    )
    ON CONFLICT DO NOTHING;

    -- Create a test building schema
    INSERT INTO building_schemas (id, design_session_id, organization_id, schema)
    VALUES (
        v_schema_id,
        v_design_session_id,
        v_org_id,
        '{"version": 1, "fields": {"name": {"type": "string"}}}'::jsonb
    )
    ON CONFLICT DO NOTHING;

    -- Create an initial version
    INSERT INTO building_schema_versions (
        organization_id,
        building_schema_id,
        number,
        patch,
        reverse_patch,
        created_at
    ) VALUES (
        v_org_id,
        v_schema_id,
        1,
        '{"op": "add", "path": "/fields/name", "value": {"type": "string"}}'::jsonb,
        '{"op": "remove", "path": "/fields/name"}'::jsonb,
        now() - interval '1 day'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Test 1: Successfully update a building schema - success is true
SELECT ok(
    (SELECT (result->>'success')::boolean FROM (
        SELECT update_building_schema(
            '55555555-5555-5555-5555-555555555555',
            '{"version": 2, "fields": {"name": {"type": "string"}, "address": {"type": "string"}}}'::jsonb,
            '{"op": "add", "path": "/fields/address", "value": {"type": "string"}}'::jsonb,
            '{"op": "remove", "path": "/fields/address"}'::jsonb,
            1
        ) AS result
    ) AS t),
    'Should return success = true when updating a valid building schema'
);

-- Test 2: Successfully update a building schema - version number is returned
SELECT is(
    (SELECT (result->>'versionNumber')::integer FROM (
        SELECT update_building_schema(
            '55555555-5555-5555-5555-555555555555',
            '{"version": 2, "fields": {"name": {"type": "string"}, "address": {"type": "string"}}}'::jsonb,
            '{"op": "add", "path": "/fields/address", "value": {"type": "string"}}'::jsonb,
            '{"op": "remove", "path": "/fields/address"}'::jsonb,
            1
        ) AS result
    ) AS t),
    2,
    'Should return version number 2'
);

-- Test 3: Verify the building schema was updated
SELECT is(
    (SELECT schema FROM building_schemas WHERE id = '55555555-5555-5555-5555-555555555555'),
    '{"version": 2, "fields": {"name": {"type": "string"}, "address": {"type": "string"}}}'::jsonb,
    'Building schema should be updated with new schema'
);

-- Test 4: Verify new version records were created
SELECT is(
    (SELECT COUNT(*) FROM building_schema_versions WHERE building_schema_id = '55555555-5555-5555-5555-555555555555'),
    3::bigint,
    'Should create new version records'
);

-- Test 5: Verify the new version record has the correct number
SELECT is(
    (SELECT number FROM building_schema_versions 
     WHERE building_schema_id = '55555555-5555-5555-5555-555555555555'
     ORDER BY created_at DESC LIMIT 1),
    2,
    'New version record should have number 2'
);

-- Test 6: Verify the new version record has the correct patch
SELECT is(
    (SELECT patch FROM building_schema_versions 
     WHERE building_schema_id = '55555555-5555-5555-5555-555555555555'
     ORDER BY created_at DESC LIMIT 1),
    '{"op": "add", "path": "/fields/address", "value": {"type": "string"}}'::jsonb,
    'New version record should have the correct patch'
);

-- Test 7: Verify the new version record has the correct reverse patch
SELECT is(
    (SELECT reverse_patch FROM building_schema_versions 
     WHERE building_schema_id = '55555555-5555-5555-5555-555555555555'
     ORDER BY created_at DESC LIMIT 1),
    '{"op": "remove", "path": "/fields/address"}'::jsonb,
    'New version record should have the correct reverse patch'
);

-- Test 8: Attempt to update a non-existent building schema
SELECT is(
    (SELECT update_building_schema(
        '66666666-6666-6666-6666-666666666666',
        '{"version": 1, "fields": {}}'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        0
    )),
    '{"success": false, "error": "Building schema not found"}'::jsonb,
    'Should fail when building schema does not exist'
);

-- Finish the tests and print a diagnostic count
SELECT * FROM finish();

ROLLBACK;
