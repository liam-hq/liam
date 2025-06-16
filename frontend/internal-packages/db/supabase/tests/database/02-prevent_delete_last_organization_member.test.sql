-- Test file for prevent_delete_last_organization_member trigger
BEGIN;

-- Load the pgtap extension
SELECT plan(3);

-- Create test users and organization
SELECT tests.create_supabase_user('owner@example.com', 'owner_user');
SELECT tests.create_supabase_user('member1@example.com', 'member1_user');
SELECT tests.create_supabase_user('member2@example.com', 'member2_user');

-- Create test organization
INSERT INTO organizations (id, name)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test Organization For Deletion')
ON CONFLICT DO NOTHING;

-- Store user IDs in temporary variables and add users to the organization
DO $$
DECLARE
    v_owner_id uuid;
    v_member1_id uuid;
    v_member2_id uuid;
    v_member1_org_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('owner@example.com') INTO v_owner_id;
    SELECT tests.get_supabase_uid('member1@example.com') INTO v_member1_id;
    SELECT tests.get_supabase_uid('member2@example.com') INTO v_member2_id;

    -- Add members to the organization
    INSERT INTO organization_members (id, user_id, organization_id)
    VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_owner_id, '22222222-2222-2222-2222-222222222222'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_member1_id, '22222222-2222-2222-2222-222222222222'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', v_member2_id, '22222222-2222-2222-2222-222222222222')
    ON CONFLICT DO NOTHING;

    -- Save member1's organization member ID
    SELECT id INTO v_member1_org_id FROM organization_members
    WHERE user_id = v_member1_id AND organization_id = '22222222-2222-2222-2222-222222222222';
END $$;

-- Test 1: Successfully delete a member when not the last one
SELECT lives_ok(
    $$DELETE FROM organization_members WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
    'Should successfully delete a member when they are not the last one'
);

-- Test 2: Verify there are still members after deleting one
SELECT is(
    (SELECT COUNT(*) FROM organization_members WHERE organization_id = '22222222-2222-2222-2222-222222222222'),
    2::bigint,
    'Should have two members remaining after deletion'
);

-- Test 3: Try to delete the last member (should fail)
SELECT throws_ok(
    $$
    -- Delete the second to last member
    DELETE FROM organization_members
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND organization_id = '22222222-2222-2222-2222-222222222222';

    -- This should fail when trying to delete the last member
    DELETE FROM organization_members
    WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' AND organization_id = '22222222-2222-2222-2222-222222222222';
    $$,
    'Cannot remove the last member of an organization',
    'Should prevent deletion of the last member of an organization'
);

-- Finish the tests and print a diagnostic count
SELECT * FROM finish();

ROLLBACK;
