-- Migration: Add workflow status to design_sessions with realtime support
-- Purpose:
--   - Persist workflow runtime state for each design session.
--   - Support SSR-friendly reads and Supabase Realtime updates to the UI.
-- Changes:
--   - Create enum type workflow_status (running|idle) if not exists.
--   - Add columns to public.design_sessions: status, started_at, finished_at.
--   - Create helpful indexes for common queries.
--   - Ensure the table is part of supabase_realtime publication for UPDATE events.
-- Safety:
--   - All operations are idempotent (IF NOT EXISTS guards where applicable).
--   - Wrapped in a transaction for atomicity.

begin;

-- 1) Create enum type if it does not exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workflow_status') then
    create type workflow_status as enum ('running', 'idle');
  end if;
end$$;

commit;
-- 2) Add columns to design_sessions
alter table public.design_sessions
  add column if not exists status workflow_status not null default 'running',
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz;

comment on column public.design_sessions.status is 'Workflow runtime status: running|idle';
comment on column public.design_sessions.started_at is 'Timestamp when workflow started';
comment on column public.design_sessions.finished_at is 'Timestamp when workflow finished (idle state)';

-- 3) Indexes for status filtering and common list queries
create index if not exists idx_design_sessions_status on public.design_sessions (status);
create index if not exists idx_design_sessions_org_created_at on public.design_sessions (organization_id, created_at desc);

-- 4) Ensure Realtime publication includes design_sessions
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'design_sessions'
  ) then
    alter publication supabase_realtime add table public.design_sessions;
  end if;
end$$;
