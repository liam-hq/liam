-- Add RLS policy for public read access to workflow_runs of publicly shared sessions
CREATE POLICY "public_workflow_runs_read" ON "public"."workflow_runs" 
FOR SELECT TO "anon" 
USING (
  "design_session_id" IN (
    SELECT "design_session_id" 
    FROM "public"."public_share_settings"
  )
);

-- Grant select permission to anon role
GRANT SELECT ON TABLE "public"."workflow_runs" TO "anon";