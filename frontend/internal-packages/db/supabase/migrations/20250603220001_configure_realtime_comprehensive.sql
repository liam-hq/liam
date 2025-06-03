-- Comprehensive realtime configuration for messages table

-- 1. Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Ensure RLS is enabled (required for realtime)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Grant necessary permissions for realtime functionality
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT UPDATE ON messages TO authenticated;

-- 4. Create or update RLS policies for messages
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their organization sessions" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their organization sessions" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

---- -- Policy for viewing messages (required for realtime)
---- CREATE POLICY "Users can view messages in their organization sessions" ON messages
---- FOR SELECT USING (
----   EXISTS (
----     SELECT 1 FROM design_sessions ds
----     WHERE ds.id = messages.design_session_id
----     AND ds.organization_id = (
----       SELECT organization_id FROM user_organizations uo
----       WHERE uo.user_id = auth.uid()
----       LIMIT 1
----     )
----   )
---- );
---- 
---- -- Policy for inserting messages
---- CREATE POLICY "Users can insert messages in their organization sessions" ON messages
---- FOR INSERT WITH CHECK (
----   EXISTS (
----     SELECT 1 FROM design_sessions ds
----     WHERE ds.id = messages.design_session_id
----     AND ds.organization_id = (
----       SELECT organization_id FROM user_organizations uo
----       WHERE uo.user_id = auth.uid()
----       LIMIT 1
----     )
----   )
---- );
---- 
---- -- Policy for updating messages (users can only update their own messages)
---- CREATE POLICY "Users can update their own messages" ON messages
---- FOR UPDATE USING (
----   user_id = auth.uid()
----   AND EXISTS (
----     SELECT 1 FROM design_sessions ds
----     WHERE ds.id = messages.design_session_id
----     AND ds.organization_id = (
----       SELECT organization_id FROM user_organizations uo
----       WHERE uo.user_id = auth.uid()
----       LIMIT 1
----     )
----   )
---- );
---- 
---- -- 5. Verify realtime is working by creating a test function
---- CREATE OR REPLACE FUNCTION test_realtime_messages()
---- RETURNS TEXT
---- LANGUAGE plpgsql
---- AS $$
---- BEGIN
----   -- Check if messages table is in realtime publication
----   IF EXISTS (
----     SELECT 1 FROM pg_publication_tables 
----     WHERE pubname = 'supabase_realtime' 
----     AND tablename = 'messages'
----   ) THEN
----     RETURN 'SUCCESS: messages table is enabled for realtime';
----   ELSE
----     RETURN 'ERROR: messages table is NOT enabled for realtime';
----   END IF;
---- END;
---- $$;
---- 
---- -- 6. Add helpful comments
---- COMMENT ON TABLE messages IS 'Chat messages table with realtime enabled for live chat functionality';
---- COMMENT ON FUNCTION test_realtime_messages() IS 'Test function to verify realtime is properly configured for messages table';
