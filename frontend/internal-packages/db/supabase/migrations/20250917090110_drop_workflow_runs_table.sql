-- Drop workflow_runs table and related infrastructure
--
-- Purpose: Remove workflow_runs table as it was never properly utilized.
-- The updateWorkflowRunStatus function was never called from deepModelingStream.ts,
-- causing workflow status to remain 'pending' and breaking right pane visibility logic.
--
-- Affected: workflow_runs table, related functions, triggers, policies, and realtime subscription

BEGIN;

-- Drop realtime subscription first
alter publication supabase_realtime drop table public.workflow_runs;

-- Drop policies
drop policy if exists "authenticated_users_can_select_org_workflow_runs" on public.workflow_runs;
drop policy if exists "authenticated_users_can_insert_org_workflow_runs" on public.workflow_runs;
drop policy if exists "authenticated_users_can_update_org_workflow_runs" on public.workflow_runs;
drop policy if exists "authenticated_users_can_delete_org_workflow_runs" on public.workflow_runs;
drop policy if exists "service_role_can_select_all_workflow_runs" on public.workflow_runs;
drop policy if exists "service_role_can_insert_all_workflow_runs" on public.workflow_runs;
drop policy if exists "service_role_can_update_all_workflow_runs" on public.workflow_runs;
drop policy if exists "service_role_can_delete_all_workflow_runs" on public.workflow_runs;

-- Drop triggers
drop trigger if exists set_workflow_runs_organization_id_trigger on public.workflow_runs;
drop trigger if exists set_workflow_runs_updated_at_trigger on public.workflow_runs;

-- Drop the workflow_runs table (this will automatically drop indexes and constraints)
drop table if exists public.workflow_runs cascade;

-- Drop related functions
drop function if exists public.set_workflow_runs_organization_id() cascade;
drop function if exists public.set_workflow_runs_updated_at() cascade;

COMMIT;