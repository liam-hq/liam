-- Add RLS policy for public read access to artifacts of publicly shared sessions
CREATE POLICY "Public read access for shared sessions" ON artifacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public_share_settings 
    WHERE public_share_settings.design_session_id = artifacts.design_session_id
  )
);