-- Allow nullable project_id in design_sessions table to support project-independent sessions
-- This migration follows the project's Supabase Branching pattern

BEGIN;

-- 1. Make project_id nullable in design_sessions table
ALTER TABLE public.design_sessions
ALTER COLUMN project_id DROP NOT NULL;

-- 2. Update the trigger function to handle NULL project_id
CREATE OR REPLACE FUNCTION public.set_design_sessions_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If project_id is provided, get organization_id from projects table
  IF NEW.project_id IS NOT NULL THEN
    NEW.organization_id := (
      SELECT organization_id
      FROM public.projects
      WHERE id = NEW.project_id
    );
  -- If project_id is NULL, organization_id must be explicitly provided
  -- This will be handled at the application level to ensure security
  ELSIF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id must be provided when project_id is NULL';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Add a check constraint to ensure data integrity
-- Either project_id is provided OR organization_id is explicitly set
ALTER TABLE public.design_sessions
ADD CONSTRAINT design_sessions_project_or_org_check
CHECK (project_id IS NOT NULL OR organization_id IS NOT NULL);

-- 4. Validate existing data (should pass since all current records have project_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.design_sessions
    WHERE project_id IS NULL AND organization_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found design_sessions with both project_id and organization_id as NULL';
  END IF;
END $$;

COMMIT;