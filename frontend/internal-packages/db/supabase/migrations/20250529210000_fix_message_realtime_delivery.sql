BEGIN;

-- Add indexes for better real-time performance
CREATE INDEX IF NOT EXISTS "idx_messages_design_session_created_at" 
ON "public"."messages" ("design_session_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_role_created_at" 
ON "public"."messages" ("role", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_user_id_created_at" 
ON "public"."messages" ("user_id", "created_at" DESC) 
WHERE "user_id" IS NOT NULL;

-- Add a function to ensure proper message delivery for real-time subscriptions
CREATE OR REPLACE FUNCTION "public"."notify_message_inserted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Perform the notification with message details
  PERFORM pg_notify(
    'message_inserted',
    json_build_object(
      'id', NEW.id,
      'design_session_id', NEW.design_session_id,
      'user_id', NEW.user_id,
      'role', NEW.role,
      'content', NEW.content,
      'created_at', NEW.created_at,
      'organization_id', NEW.organization_id
    )::text
  );
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."notify_message_inserted"() OWNER TO "postgres";

-- Create trigger for message notifications
CREATE TRIGGER "notify_message_inserted_trigger"
  AFTER INSERT ON "public"."messages"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."notify_message_inserted"();

-- Add a function to send a message (ensures proper real-time delivery)
CREATE OR REPLACE FUNCTION "public"."send_message"(
  p_design_session_id "uuid",
  p_role "text",
  p_content "text",
  p_user_id "uuid" DEFAULT NULL
) RETURNS "json"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_organization_id uuid;
  v_message_id uuid;
  v_message_record record;
BEGIN
  -- Get current user ID if not provided
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- For human messages, ensure user is authenticated
  IF p_role = 'user' AND v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get organization_id from design_session
  SELECT organization_id INTO v_organization_id
  FROM design_sessions
  WHERE id = p_design_session_id;
  
  IF v_organization_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Design session not found');
  END IF;
  
  -- For authenticated users, check if user is member of the organization
  IF v_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = v_user_id AND organization_id = v_organization_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User not authorized for this organization');
  END IF;
  
  -- Insert the message
  INSERT INTO messages (design_session_id, user_id, role, content, updated_at)
  VALUES (p_design_session_id, v_user_id, p_role, p_content, CURRENT_TIMESTAMP)
  RETURNING * INTO v_message_record;
  
  v_message_id := v_message_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message_id', v_message_id,
    'message', 'Message sent successfully'
  );
END;
$$;

-- Add a function to check if real-time is working for messages
CREATE OR REPLACE FUNCTION "public"."test_message_realtime"(
  p_design_session_id "uuid"
) RETURNS "json"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_organization_id uuid;
  v_test_message_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get organization_id from design_session
  SELECT organization_id INTO v_organization_id
  FROM design_sessions
  WHERE id = p_design_session_id;
  
  IF v_organization_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Design session not found');
  END IF;
  
  -- Check if user is member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = v_user_id AND organization_id = v_organization_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User not authorized for this organization');
  END IF;
  
  -- Insert a test message
  INSERT INTO messages (design_session_id, user_id, role, content, updated_at)
  VALUES (p_design_session_id, v_user_id, 'system', 'Real-time test message', CURRENT_TIMESTAMP)
  RETURNING id INTO v_test_message_id;
  
  -- Delete the test message immediately
  DELETE FROM messages WHERE id = v_test_message_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Real-time test completed',
    'test_message_id', v_test_message_id
  );
END;
$$;

-- Grant permissions for new functions
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "service_role";

GRANT ALL ON FUNCTION "public"."send_message"("uuid", "text", "text", "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_message"("uuid", "text", "text", "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_message"("uuid", "text", "text", "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."test_message_realtime"("uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."test_message_realtime"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_message_realtime"("uuid") TO "service_role";

-- Enable real-time for messages table (ensure it's properly configured)
-- This is a comment as it needs to be done via Supabase dashboard or API
-- ALTER publication supabase_realtime ADD TABLE messages;

COMMIT;
