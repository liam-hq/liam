BEGIN;

-- Add indexes for better real-time performance
CREATE INDEX IF NOT EXISTS "idx_messages_design_session_created_at" 
ON "public"."messages" ("design_session_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_role_created_at" 
ON "public"."messages" ("role", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_user_id_created_at" 
ON "public"."messages" ("user_id", "created_at" DESC) 
WHERE "user_id" IS NOT NULL;

-- Enable real-time for messages table (ensure it's properly configured)
-- This is a comment as it needs to be done via Supabase dashboard or API
-- ALTER publication supabase_realtime ADD TABLE messages;

COMMIT;
