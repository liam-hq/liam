-- Create execution_status enum for workflow execution states
CREATE TYPE execution_status_enum AS ENUM ('idle', 'running', 'success', 'failure');

-- Create workflow_executions table for managing workflow execution status
CREATE TABLE "public"."workflow_executions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "design_session_id" uuid NOT NULL REFERENCES "public"."design_sessions" ("id") ON DELETE CASCADE,
    "organization_id" uuid NOT NULL REFERENCES "public"."organizations" ("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users" ("id") ON DELETE SET NULL,
    "status" "public"."execution_status_enum" NOT NULL DEFAULT 'idle',
    "workflow_type" text NOT NULL,
    "started_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "completed_at" timestamptz,
    "error_message" text,
    "metadata" jsonb,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX "idx_workflow_executions_design_session_id" ON "public"."workflow_executions" ("design_session_id");
CREATE INDEX "idx_workflow_executions_organization_id" ON "public"."workflow_executions" ("organization_id");
CREATE INDEX "idx_workflow_executions_status" ON "public"."workflow_executions" ("status");
CREATE INDEX "idx_workflow_executions_started_at" ON "public"."workflow_executions" ("started_at");

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_executions_updated_at
    BEFORE UPDATE ON "public"."workflow_executions"
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_executions_updated_at();

-- Add RLS policies
ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;

-- Policy for organization members to view workflow executions
CREATE POLICY "workflow_executions_select_policy" ON "public"."workflow_executions"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."organization_members" om
            WHERE om.organization_id = workflow_executions.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Policy for organization members to insert workflow executions
CREATE POLICY "workflow_executions_insert_policy" ON "public"."workflow_executions"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."organization_members" om
            WHERE om.organization_id = workflow_executions.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Policy for organization members to update workflow executions
CREATE POLICY "workflow_executions_update_policy" ON "public"."workflow_executions"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."organization_members" om
            WHERE om.organization_id = workflow_executions.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Policy for organization members to delete workflow executions
CREATE POLICY "workflow_executions_delete_policy" ON "public"."workflow_executions"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."organization_members" om
            WHERE om.organization_id = workflow_executions.organization_id
            AND om.user_id = auth.uid()
        )
    );