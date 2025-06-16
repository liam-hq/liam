-- Test file for invite_organization_member function
BEGIN;

-- Load the pgtap extension
SELECT plan(13);

-- Create test users and organization
SELECT tests.create_supabase_user('inviter@example.com', 'inviter_user');
SELECT tests.create_supabase_user('existing@example.com', 'existing_user');
SELECT tests.create_supabase_user('new@example.com', 'new_user');
SELECT tests.create_supabase_user('reinvite@example.com', 'reinvite_user');

-- Create test organization
INSERT INTO organizations (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Organization')
ON CONFLICT DO NOTHING;

-- Store user IDs in temporary variables
DO $$
DECLARE
    v_inviter_id uuid;
    v_existing_id uuid;
    v_new_id uuid;
    v_reinvite_id uuid;
BEGIN
    -- Get user IDs
    SELECT tests.get_supabase_uid('inviter@example.com') INTO v_inviter_id;
    SELECT tests.get_supabase_uid('existing@example.com') INTO v_existing_id;
    SELECT tests.get_supabase_uid('new@example.com') INTO v_new_id;
    SELECT tests.get_supabase_uid('reinvite@example.com') INTO v_reinvite_id;
    
    -- Add inviter and existing user to the organization
    INSERT INTO organization_members (user_id, organization_id)
    VALUES 
      (v_inviter_id, '11111111-1111-1111-1111-111111111111'),
      (v_existing_id, '11111111-1111-1111-1111-111111111111')
    ON CONFLICT DO NOTHING;
    
    -- Create an existing invitation for reinvite user
    INSERT INTO invitations (id, email, invite_by_user_id, organization_id, invited_at)
    VALUES (
      '22222222-2222-2222-2222-222222222222',
      'reinvite@example.com',
      v_inviter_id,
      '11111111-1111-1111-1111-111111111111',
      NOW() - INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- Set up authentication context for tests
DO $$
DECLARE
    v_inviter_id uuid;
BEGIN
    -- Get inviter user ID
    SELECT tests.get_supabase_uid('inviter@example.com') INTO v_inviter_id;
    
    -- Set up auth context to simulate the inviter user
    EXECUTE format('SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ''{"sub": "%s"}''', v_inviter_id);
END $$;

-- Test 1: Successfully invite a new member - success is true
SELECT ok(
  (SELECT (result->>'success')::boolean FROM (SELECT invite_organization_member('new@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should return success = true'
);

-- Test 2: Successfully invite a new member - invitation token is included
SELECT ok(
  (SELECT result ? 'invitation_token' FROM (SELECT invite_organization_member('new@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should include invitation_token key'
);

-- Test 3: Successfully invite a new member - error is null
SELECT is(
  (SELECT result->>'error' FROM (SELECT invite_organization_member('new@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  NULL,
  'Error should be null'
);

-- Test 4: Verify the invitation was created
SELECT is(
  (SELECT COUNT(*) FROM invitations WHERE email = 'new@example.com' AND organization_id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'Should create a new invitation record'
);

-- Test 5: Attempt to invite a user who is already a member
SELECT is(
  (SELECT invite_organization_member('existing@example.com', '11111111-1111-1111-1111-111111111111')),
  '{"success": false, "invitation_token": null, "error": "this user is already a member of the organization"}'::jsonb,
  'Should fail when inviting an existing member'
);

-- Test 6: Re-invite a user who already has a pending invitation - success true
SELECT ok(
  (SELECT (result->>'success')::boolean FROM (SELECT invite_organization_member('reinvite@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should return success = true'
);

-- Test 7: Re-invite a user who already has a pending invitation - invitation token is included
SELECT ok(
  (SELECT result ? 'invitation_token' FROM (SELECT invite_organization_member('reinvite@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should include invitation_token key'
);

-- Test 8: Re-invite a user who already has a pending invitation - error is null
SELECT is(
  (SELECT result->>'error' FROM (SELECT invite_organization_member('reinvite@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  NULL,
  'Error should be null'
);

-- Test 9: Verify the invitation was updated, not duplicated
SELECT is(
  (SELECT COUNT(*) FROM invitations WHERE email = 'reinvite@example.com' AND organization_id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'Should not create duplicate invitation'
);

-- Test 10: Verify the invited_at timestamp was updated
SELECT ok(
  (SELECT invited_at > (NOW() - INTERVAL '10 seconds') 
   FROM invitations 
   WHERE email = 'reinvite@example.com' AND organization_id = '11111111-1111-1111-1111-111111111111'),
  'Should update the invited_at timestamp'
);

-- Test 11: Case insensitivity test - success is true
SELECT ok(
  (SELECT (result->>'success')::boolean FROM (SELECT invite_organization_member('NEW@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should return success = true'
);

-- Test 12: Case insensitivity test - invitation token is included
SELECT ok(
  (SELECT result ? 'invitation_token' FROM (SELECT invite_organization_member('NEW@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  'Should include invitation_token key'
);

-- Test 13: Case insensitivity test - error is null
SELECT is(
  (SELECT result->>'error' FROM (SELECT invite_organization_member('NEW@example.com', '11111111-1111-1111-1111-111111111111') AS result) AS t),
  NULL,
  'Error should be null'
);

-- Reset authentication context
RESET ROLE;

-- Finish the tests and print a diagnostic count
SELECT * FROM finish();

ROLLBACK;
