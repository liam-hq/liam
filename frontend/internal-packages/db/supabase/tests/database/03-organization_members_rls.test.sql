-- Test file for is_current_user_org_member function and RLS policies
BEGIN;

-- Load the pgtap extension
SELECT plan(8);

-- Set role to postgres for preparation
SET ROLE postgres;

-- Create test users
SELECT tests.create_supabase_user('org_owner@example.com', 'org_owner');
SELECT tests.create_supabase_user('non_member@example.com', 'non_member');
SELECT tests.create_supabase_user('other_user@example.com', 'other_user');
SELECT tests.create_supabase_user('new_member@example.com', 'new_member');
SELECT tests.create_supabase_user('temp_user@example.com', 'temp_user');

-- Get user IDs and setup test data
DO $$
DECLARE
    v_owner_id uuid;
    v_other_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('org_owner@example.com') INTO v_owner_id;
    SELECT tests.get_supabase_uid('other_user@example.com') INTO v_other_user_id;

    -- Create test organization
    INSERT INTO organizations (id, name)
    VALUES ('33333333-3333-3333-3333-333333333333', 'Test Org 1')
    ON CONFLICT DO NOTHING;

    -- Add org_owner to organization
    INSERT INTO organization_members (id, user_id, organization_id)
    VALUES (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        v_owner_id,
        '33333333-3333-3333-3333-333333333333'
    )
    ON CONFLICT DO NOTHING;

    -- Add other_user to organization for delete test
    INSERT INTO organization_members (id, user_id, organization_id)
    VALUES (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        v_other_user_id,
        '33333333-3333-3333-3333-333333333333'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Test 1: is_current_user_org_member function returns true for an org member
DO $$
DECLARE
    v_owner_id uuid;
BEGIN
    -- Get user ID
    SELECT tests.get_supabase_uid('org_owner@example.com') INTO v_owner_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_owner_id);
END $$;

SELECT ok(
    is_current_user_org_member('33333333-3333-3333-3333-333333333333'),
    'is_current_user_org_member returns true for an org member'
);

-- Reset authentication context
RESET ROLE;

-- Test 2: is_current_user_org_member function returns false for a non-member
DO $$
DECLARE
    v_non_member_id uuid;
BEGIN
    -- Get user ID
    SELECT tests.get_supabase_uid('non_member@example.com') INTO v_non_member_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_non_member_id);
END $$;

SELECT ok(
    NOT is_current_user_org_member('33333333-3333-3333-3333-333333333333'),
    'is_current_user_org_member returns false for a non-member'
);

-- Reset authentication context
RESET ROLE;

-- Test 3: RLS - Org member can select other members in their org
DO $$
DECLARE
    v_owner_id uuid;
BEGIN
    -- Get user ID
    SELECT tests.get_supabase_uid('org_owner@example.com') INTO v_owner_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_owner_id);
END $$;

SELECT ok(
    EXISTS(
        SELECT 1 FROM organization_members
        WHERE organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Org member can select other members in their org'
);

-- Reset authentication context
RESET ROLE;

-- Test 4: RLS - Non-member cannot select org members
DO $$
DECLARE
    v_non_member_id uuid;
BEGIN
    -- Get user ID
    SELECT tests.get_supabase_uid('non_member@example.com') INTO v_non_member_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_non_member_id);
END $$;

SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM organization_members
        WHERE organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Non-member cannot select org members'
);

-- Reset authentication context
RESET ROLE;

-- Test 5: RLS - Non-member can add themselves as a new member
-- TODO: Security concern - This RLS policy allows any authenticated user to add themselves to any organization without invitation.
-- This could pose a security risk in a production environment. Consider updating the RLS policy to only allow:
-- 1. Users who have received an invitation via the invitation system
-- 2. Or users explicitly approved by existing organization members
-- The current test confirms the existing behavior but the policy itself should be reviewed.
DO $$
DECLARE
    v_non_member_id uuid;
BEGIN
    -- Get non-member ID
    SELECT tests.get_supabase_uid('non_member@example.com') INTO v_non_member_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_non_member_id);

    -- Try to add non-member to the organization
    INSERT INTO organization_members (user_id, organization_id)
    VALUES (v_non_member_id, '33333333-3333-3333-3333-333333333333');
END $$;

-- Reset authentication context
RESET ROLE;

-- Check the result
SELECT ok(
    EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = (SELECT tests.get_supabase_uid('non_member@example.com'))
        AND organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Non-member can add themselves as a new member'
);

-- Test 6: RLS - Org member can add another user to their org
DO $$
DECLARE
    v_owner_id uuid;
    v_new_member_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('org_owner@example.com') INTO v_owner_id;
    SELECT tests.get_supabase_uid('new_member@example.com') INTO v_new_member_id;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_owner_id);

    -- Try to add new_member to the organization
    INSERT INTO organization_members (user_id, organization_id)
    VALUES (v_new_member_id, '33333333-3333-3333-3333-333333333333');
END $$;

-- Reset authentication context
RESET ROLE;

-- Check the result
SELECT ok(
    EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = (SELECT tests.get_supabase_uid('new_member@example.com'))
        AND organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Org member can add another user to their org'
);

-- Test 7: RLS - Non-member cannot add others to an org they do not belong to
DO $$
DECLARE
    v_non_member_id uuid;
    v_temp_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('non_member@example.com') INTO v_non_member_id;
    SELECT tests.get_supabase_uid('temp_user@example.com') INTO v_temp_user_id;

    -- First ensure non_member is not in the organization (added in test 5)
    DELETE FROM organization_members
    WHERE user_id = v_non_member_id
    AND organization_id = '33333333-3333-3333-3333-333333333333';

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_non_member_id);

    -- Try to add temp_user to the organization (should fail)
    BEGIN
        INSERT INTO organization_members (user_id, organization_id)
        VALUES (v_temp_user_id, '33333333-3333-3333-3333-333333333333');
    EXCEPTION
        WHEN OTHERS THEN
            -- Expected to fail
            NULL;
    END;
END $$;

-- Reset authentication context
RESET ROLE;

-- Check the result
SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = (SELECT tests.get_supabase_uid('temp_user@example.com'))
        AND organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Non-member cannot add others to an org they do not belong to'
);

-- Test 8: RLS - Org member can remove another member from their org
DO $$
DECLARE
    v_owner_id uuid;
    v_other_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('org_owner@example.com') INTO v_owner_id;
    SELECT tests.get_supabase_uid('other_user@example.com') INTO v_other_user_id;

    -- Ensure other_user is in the organization
    INSERT INTO organization_members (id, user_id, organization_id)
    VALUES (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        v_other_user_id,
        '33333333-3333-3333-3333-333333333333'
    )
    ON CONFLICT DO NOTHING;

    -- Set auth context for this test
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_owner_id);

    -- Delete the other user from the organization
    DELETE FROM organization_members
    WHERE user_id = v_other_user_id
    AND organization_id = '33333333-3333-3333-3333-333333333333';
END $$;

-- Reset authentication context
RESET ROLE;

-- Check the result
SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM organization_members
        WHERE user_id = (SELECT tests.get_supabase_uid('other_user@example.com'))
        AND organization_id = '33333333-3333-3333-3333-333333333333'
    ),
    'Org member can remove another member from their org'
);

-- Finish the tests and print a diagnostic count
SELECT * FROM finish();

ROLLBACK;