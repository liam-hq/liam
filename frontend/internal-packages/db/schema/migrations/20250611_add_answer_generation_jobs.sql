-- Add table for tracking answer generation background jobs
CREATE TABLE IF NOT EXISTS answer_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  design_session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Input data
  user_input TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('Ask', 'Build')),
  
  -- Results
  generated_answer TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_answer_generation_jobs_job_id ON answer_generation_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_answer_generation_jobs_design_session_id ON answer_generation_jobs(design_session_id);
CREATE INDEX IF NOT EXISTS idx_answer_generation_jobs_status ON answer_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_answer_generation_jobs_created_at ON answer_generation_jobs(created_at);

-- Add RLS policies
ALTER TABLE answer_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access jobs from their organization
CREATE POLICY answer_generation_jobs_org_access ON answer_generation_jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_answer_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_answer_generation_jobs_updated_at
  BEFORE UPDATE ON answer_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_answer_generation_jobs_updated_at();

-- Add database functions for job management
CREATE OR REPLACE FUNCTION create_answer_generation_job(
  p_job_id TEXT,
  p_design_session_id UUID,
  p_organization_id UUID,
  p_user_id UUID,
  p_user_input TEXT,
  p_mode TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO answer_generation_jobs (
    job_id, design_session_id, organization_id, user_id, user_input, mode, status
  ) VALUES (
    p_job_id, p_design_session_id, p_organization_id, p_user_id, p_user_input, p_mode, 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_answer_generation_job_status(p_job_id TEXT)
RETURNS TABLE(
  job_id TEXT,
  status TEXT,
  generated_answer TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.job_id,
    j.status,
    j.generated_answer,
    j.error_message,
    j.created_at,
    j.completed_at
  FROM answer_generation_jobs j
  WHERE j.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_answer_generation_job_processing(p_job_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE answer_generation_jobs 
  SET status = 'processing', started_at = NOW()
  WHERE job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_answer_generation_job(
  p_job_id TEXT,
  p_success BOOLEAN,
  p_generated_answer TEXT,
  p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE answer_generation_jobs 
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    generated_answer = p_generated_answer,
    error_message = p_error_message,
    completed_at = NOW()
  WHERE job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
