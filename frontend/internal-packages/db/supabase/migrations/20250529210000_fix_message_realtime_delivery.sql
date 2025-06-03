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

-- Grant permissions for new functions
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_message_inserted"() TO "service_role";

-- Enable real-time for messages table (ensure it's properly configured)
-- This is a comment as it needs to be done via Supabase dashboard or API
-- ALTER publication supabase_realtime ADD TABLE messages;

COMMIT;
