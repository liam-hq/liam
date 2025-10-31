-- Migration: Introduce runs and run_events tables with derived status tracking
-- Purpose:
--   - Reset workflow_run_status enum for workflow run lifecycle tracking.
--   - Create runs/run_events tables with triggers to keep organization scope aligned.
--   - Provide triggers for keeping run metadata in sync with run_events history.
--   - Configure RLS policies, grants, and Supabase Realtime publications.
-- Safety:
--   - Uses IF EXISTS / IF NOT EXISTS guards to keep operations idempotent where possible.
--   - Triggers maintain runs.status/ended_at to avoid manual updates.

BEGIN;

-- 1) Reset enum type workflow_run_status (legacy references were dropped previously).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'workflow_run_status'
  ) THEN
    EXECUTE 'drop type public.workflow_run_status cascade';
  END IF;
END;
$$;

CREATE TYPE public.workflow_run_status AS ENUM ('running', 'completed', 'error');

-- 2) runs table: one row per design_session to track the latest workflow execution state.
CREATE TABLE IF NOT EXISTS public.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_session_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_by_user_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT runs_design_session_id_fkey FOREIGN KEY (design_session_id)
    REFERENCES public.design_sessions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT runs_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT runs_created_by_user_id_fkey FOREIGN KEY (created_by_user_id)
    REFERENCES public.users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT runs_design_session_id_key UNIQUE (design_session_id)
);

CREATE INDEX IF NOT EXISTS runs_design_session_id_idx ON public.runs (design_session_id);
CREATE INDEX IF NOT EXISTS runs_organization_id_idx ON public.runs (organization_id);

COMMENT ON TABLE public.runs IS 'Current workflow run per design session (1:1). Updated via run_events trigger to reflect the latest lifecycle state.';
COMMENT ON COLUMN public.runs.id IS 'Unique identifier for the run record associated with a design session.';
COMMENT ON COLUMN public.runs.design_session_id IS 'Design session owning this run record (enforced unique to keep 1:1).';
COMMENT ON COLUMN public.runs.organization_id IS 'Organization scope for the run; auto-populated from the design session.';
COMMENT ON COLUMN public.runs.created_by_user_id IS 'User that initiated or last restarted the workflow run.';
COMMENT ON COLUMN public.runs.started_at IS 'Timestamp when the run started (defaults to insertion time).';
COMMENT ON COLUMN public.runs.ended_at IS 'Timestamp of the most recent terminal event (completed or error).';

-- Trigger to mirror organization_id from the parent design session.
CREATE OR REPLACE FUNCTION public.set_runs_organization_id() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  IF NEW.design_session_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id
  INTO org_id
  FROM public.design_sessions
  WHERE id = NEW.design_session_id;

  IF org_id IS NOT NULL THEN
    NEW.organization_id := org_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_runs_organization_id_trigger ON public.runs;
CREATE TRIGGER set_runs_organization_id_trigger
  BEFORE INSERT OR UPDATE ON public.runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_runs_organization_id();

-- 3) run_events table: immutable history of status transitions for each run.
CREATE TABLE IF NOT EXISTS public.run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  status public.workflow_run_status NOT NULL,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT run_events_run_id_fkey FOREIGN KEY (run_id)
    REFERENCES public.runs (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT run_events_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT run_events_created_by_user_id_fkey FOREIGN KEY (created_by_user_id)
    REFERENCES public.users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS run_events_run_id_created_at_idx ON public.run_events (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS run_events_organization_id_idx ON public.run_events (organization_id);

COMMENT ON TABLE public.run_events IS 'Immutable log of workflow run state transitions. Each insert captures a new status event for a run.';
COMMENT ON COLUMN public.run_events.run_id IS 'Foreign key to the run this event belongs to.';
COMMENT ON COLUMN public.run_events.organization_id IS 'Organization copied from the parent run for multi-tenant scoping.';
COMMENT ON COLUMN public.run_events.status IS 'Workflow status captured by this event (running, completed, error).';
COMMENT ON COLUMN public.run_events.created_by_user_id IS 'User that recorded the event (if applicable).';
COMMENT ON COLUMN public.run_events.created_at IS 'Timestamp when the event was recorded.';

-- Trigger to mirror organization_id from runs when inserting events.
CREATE OR REPLACE FUNCTION public.set_run_events_organization_id() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  IF NEW.run_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id
  INTO org_id
  FROM public.runs
  WHERE id = NEW.run_id;

  IF org_id IS NOT NULL THEN
    NEW.organization_id := org_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_run_events_organization_id_trigger ON public.run_events;
CREATE TRIGGER set_run_events_organization_id_trigger
  BEFORE INSERT OR UPDATE ON public.run_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_run_events_organization_id();

-- After insert trigger to sync the latest status/ended_at onto runs.
CREATE OR REPLACE FUNCTION public.apply_run_event_to_runs() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $$
DECLARE
  effective_timestamp timestamptz;
BEGIN
  effective_timestamp := COALESCE(NEW.created_at, now());

  UPDATE public.runs
  SET ended_at = CASE
        WHEN NEW.status IN ('completed', 'error') THEN effective_timestamp
        ELSE ended_at
      END
  WHERE id = NEW.run_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_run_event_to_runs_trigger ON public.run_events;
CREATE TRIGGER apply_run_event_to_runs_trigger
  AFTER INSERT ON public.run_events
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_run_event_to_runs();

-- 4) Row Level Security & policies for runs and run_events.
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_users_can_select_org_runs" ON public.runs;
DROP POLICY IF EXISTS "authenticated_users_can_insert_org_runs" ON public.runs;
DROP POLICY IF EXISTS "authenticated_users_can_update_org_runs" ON public.runs;
DROP POLICY IF EXISTS "authenticated_users_can_delete_org_runs" ON public.runs;
DROP POLICY IF EXISTS "service_role_can_select_all_runs" ON public.runs;
DROP POLICY IF EXISTS "service_role_can_insert_all_runs" ON public.runs;
DROP POLICY IF EXISTS "service_role_can_update_all_runs" ON public.runs;
DROP POLICY IF EXISTS "service_role_can_delete_all_runs" ON public.runs;

CREATE POLICY "authenticated_users_can_select_org_runs"
  ON public.runs
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_select_org_runs"
  ON public.runs
  IS 'Authenticated users can view runs for organizations they belong to.';

CREATE POLICY "authenticated_users_can_insert_org_runs"
  ON public.runs
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_insert_org_runs"
  ON public.runs
  IS 'Authenticated users can create runs only inside organizations they belong to.';

CREATE POLICY "authenticated_users_can_update_org_runs"
  ON public.runs
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_update_org_runs"
  ON public.runs
  IS 'Authenticated users can update runs only inside organizations they belong to.';

CREATE POLICY "authenticated_users_can_delete_org_runs"
  ON public.runs
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_delete_org_runs"
  ON public.runs
  IS 'Authenticated users can delete runs only inside organizations they belong to.';

CREATE POLICY "service_role_can_select_all_runs"
  ON public.runs
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "service_role_can_insert_all_runs"
  ON public.runs
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_runs"
  ON public.runs
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_runs"
  ON public.runs
  FOR DELETE TO service_role
  USING (true);

DROP POLICY IF EXISTS "authenticated_users_can_select_org_run_events" ON public.run_events;
DROP POLICY IF EXISTS "authenticated_users_can_insert_org_run_events" ON public.run_events;
DROP POLICY IF EXISTS "authenticated_users_can_update_org_run_events" ON public.run_events;
DROP POLICY IF EXISTS "authenticated_users_can_delete_org_run_events" ON public.run_events;
DROP POLICY IF EXISTS "service_role_can_select_all_run_events" ON public.run_events;
DROP POLICY IF EXISTS "service_role_can_insert_all_run_events" ON public.run_events;
DROP POLICY IF EXISTS "service_role_can_update_all_run_events" ON public.run_events;
DROP POLICY IF EXISTS "service_role_can_delete_all_run_events" ON public.run_events;

CREATE POLICY "authenticated_users_can_select_org_run_events"
  ON public.run_events
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_select_org_run_events"
  ON public.run_events
  IS 'Authenticated users can view run events for organizations they belong to.';

CREATE POLICY "authenticated_users_can_insert_org_run_events"
  ON public.run_events
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_insert_org_run_events"
  ON public.run_events
  IS 'Authenticated users can create run events only inside organizations they belong to.';

CREATE POLICY "authenticated_users_can_update_org_run_events"
  ON public.run_events
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_update_org_run_events"
  ON public.run_events
  IS 'Authenticated users can update run events only inside organizations they belong to.';

CREATE POLICY "authenticated_users_can_delete_org_run_events"
  ON public.run_events
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "authenticated_users_can_delete_org_run_events"
  ON public.run_events
  IS 'Authenticated users can delete run events only inside organizations they belong to.';

CREATE POLICY "service_role_can_select_all_run_events"
  ON public.run_events
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "service_role_can_insert_all_run_events"
  ON public.run_events
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_run_events"
  ON public.run_events
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_run_events"
  ON public.run_events
  FOR DELETE TO service_role
  USING (true);

-- 5) Grants for tables and helper functions (mirrors existing Supabase expectations).
GRANT ALL ON TABLE public.runs TO anon;
GRANT ALL ON TABLE public.runs TO authenticated;
GRANT ALL ON TABLE public.runs TO service_role;

GRANT ALL ON TABLE public.run_events TO anon;
GRANT ALL ON TABLE public.run_events TO authenticated;
GRANT ALL ON TABLE public.run_events TO service_role;

GRANT ALL ON FUNCTION public.set_runs_organization_id() TO anon;
GRANT ALL ON FUNCTION public.set_runs_organization_id() TO authenticated;
GRANT ALL ON FUNCTION public.set_runs_organization_id() TO service_role;

GRANT ALL ON FUNCTION public.set_run_events_organization_id() TO anon;
GRANT ALL ON FUNCTION public.set_run_events_organization_id() TO authenticated;
GRANT ALL ON FUNCTION public.set_run_events_organization_id() TO service_role;

GRANT ALL ON FUNCTION public.apply_run_event_to_runs() TO anon;
GRANT ALL ON FUNCTION public.apply_run_event_to_runs() TO authenticated;
GRANT ALL ON FUNCTION public.apply_run_event_to_runs() TO service_role;

-- 6) Attach tables to Supabase Realtime publication (idempotent guards).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'runs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'run_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.run_events;
  END IF;
END;
$$;

COMMIT;
