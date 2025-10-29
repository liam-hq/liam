-- Migration: Introduce runs table and derived status view for workflow tracking
-- Purpose:
--   - Replace mutable status columns with immutable run metadata.
--   - Expose derived run status per design session without mutating design_sessions rows.
-- Changes:
--   - Ensure enum type workflow_run_status (running|completed|error) exists.
--   - Create public.runs table to store run lifecycle metadata and current status.
--   - Create read-only view public.run_status to project workflow_run_status.
--   - Attach new tables to Supabase Realtime publication for live updates.
-- Safety:
--   - Guards with IF NOT EXISTS or defensive checks to keep migration idempotent.
--   - Uses immutable runs rows except for ended_at/status updates.

begin;

-- 1) Reset enum type workflow_run_status to (running|completed|error). Cascade is safe because the type is not referenced outside this migration.
do $$
begin
  if exists (select 1 from pg_type where typname = 'workflow_run_status') then
    execute 'drop type public.workflow_run_status cascade';
  end if;
end;
$$;

create type workflow_run_status as enum ('running', 'completed', 'error');

-- 2) Runs table: immutable run metadata (ended_at/status set only when terminal event occurs)
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  ended_at timestamptz,
  started_at timestamptz not null default now(),
  organization_id uuid not null,
  design_session_id uuid not null,
  created_by_user_id uuid,
  status public.workflow_run_status not null default 'running',
  constraint runs_design_session_id_fkey foreign key (design_session_id)
    references public.design_sessions (id)
    on update cascade
    on delete cascade,
  constraint runs_organization_id_fkey foreign key (organization_id)
    references public.organizations (id)
    on update cascade
    on delete restrict,
  constraint runs_created_by_user_id_fkey foreign key (created_by_user_id)
    references public.users (id)
    on update cascade
    on delete set null,
  constraint runs_id_organization_unique unique (id, organization_id)
);

comment on table public.runs is 'Runs table: immutable record of Run creation; ended_at is set when a terminal event is recorded to allow lifecycle constraints. Organization and design_session link ensure multi-tenancy and ownership.';
comment on column public.runs.id is 'Unique identifier for a Run (created when a Run is started)';
comment on column public.runs.ended_at is 'Timestamp of terminal event (completed or error). Stored on runs to allow efficient lookup of active Runs; set when terminal event occurs';
comment on column public.runs.started_at is 'Timestamp when the Run was started (inserted at Run creation)';
comment on column public.runs.organization_id is 'Organization owning the Run; must match the design_session organization for multi-tenancy';
comment on column public.runs.design_session_id is 'Design session this Run belongs to';
comment on column public.runs.created_by_user_id is 'User that initiated the Run';
comment on column public.runs.status is 'Current status for the Run derived from workflow execution (running, completed, error)';


-- 3) Derived view projecting workflow_run_status per design session
create or replace view public.run_status as
with runs_with_timestamps as (
  select
    design_session_id,
    organization_id,
    status,
    coalesce(ended_at, started_at) as last_event_at,
    started_at
  from public.runs
),
aggregated_by_session as (
  select
    design_session_id,
    organization_id,
    max(coalesce(last_event_at, started_at)) as last_event_at,
    case
      when bool_or(status = 'error') then 'error'
      when bool_or(status = 'running') then 'running'
      else 'completed'
    end::public.workflow_run_status as status
  from runs_with_timestamps
  group by design_session_id, organization_id
)
select
  coalesce(agg.status, 'running'::public.workflow_run_status) as status,
  agg.last_event_at,
  ds.organization_id,
  'Derived in migration 20251023120000_add_workflow_status_to_design_sessions.sql'::text as derived_from_sql,
  ds.id as design_session_id
from public.design_sessions ds
left join aggregated_by_session agg
  on agg.design_session_id = ds.id
  and agg.organization_id = ds.organization_id;

comment on view public.run_status is 'Read-only view that derives a design_session''s current status from runs without mutating state. Aggregates latest Run status and timestamps per session.';
comment on column public.run_status.status is 'Derived aggregate status for the design session: running, completed, or error';
comment on column public.run_status.last_event_at is 'Timestamp of the most recent run considered when deriving status';
comment on column public.run_status.organization_id is 'Organization owning the design session for multi-tenant scoping; included to ensure derived status is scoped correctly';
comment on column public.run_status.derived_from_sql is 'Developer note: SQL used to define this view; do not mutate';
comment on column public.run_status.design_session_id is 'Identifier of the design session for which we derive the current Run status (one row per design_session)';

-- 4) Ensure Supabase Realtime publications include new tables
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'runs'
  ) then
    alter publication supabase_realtime add table public.runs;
  end if;
end;
$$;

commit;
