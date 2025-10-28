-- Migration: Introduce immutable runs and run_events tables for workflow tracking
-- Purpose:
--   - Replace mutable status columns with append-only run metadata.
--   - Expose derived run status per design session without mutating design_sessions rows.
-- Changes:
--   - Create enum type run_event_type (started|completed|error) if not present.
--   - Create public.runs table to store run lifecycle metadata.
--   - Create public.run_events table to persist immutable events with an update guard trigger.
--   - Create read-only view public.run_status_by_design_session to project workflow_run_status.
--   - Attach new tables to Supabase Realtime publication for live updates.
-- Safety:
--   - Guards with IF NOT EXISTS or defensive checks to keep migration idempotent.
--   - Uses immutable run_events design; updates are prevented at the database level.

begin;

-- 1) Create enum type run_event_type (started|completed|error) if needed
do $$
begin
  if not exists (select 1 from pg_type where typname = 'run_event_type') then
    create type run_event_type as enum ('started', 'completed', 'error');
  end if;
end;
$$;

-- 2) Runs table: immutable run metadata (ended_at set only when a terminal event exists)
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  ended_at timestamptz,
  started_at timestamptz not null default now(),
  organization_id uuid not null,
  design_session_id uuid not null,
  created_by_user_id uuid,
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

create index if not exists idx_runs_design_session_id on public.runs (design_session_id);
create index if not exists idx_runs_organization_id on public.runs (organization_id, started_at desc);

-- 3) Immutable run events table with update guard
create table if not exists public.run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  event_at timestamptz not null default now(),
  event_type run_event_type not null,
  organization_id uuid not null,
  constraint run_events_run_id_org_fkey foreign key (run_id, organization_id)
    references public.runs (id, organization_id)
    on update cascade
    on delete cascade,
  constraint run_events_organization_id_fkey foreign key (organization_id)
    references public.organizations (id)
    on update cascade
    on delete restrict
);

comment on table public.run_events is 'Immutable stream of events for Runs. Events are append-only; database-level immutability must be enforced. Install a BEFORE UPDATE trigger named trg_reject_update_run_events() that RAISES EXCEPTION on any UPDATE to this table to guarantee event immutability. Also create a read-only view run_status_by_design_session that derives current status per design_session from run_events (derivation SQL documented in migration scripts).';
comment on column public.run_events.id is 'Unique identifier for each immutable event row';
comment on column public.run_events.run_id is 'References runs.id for the related Run';
comment on column public.run_events.event_at is 'Timestamp when the event was recorded';
comment on column public.run_events.event_type is 'Type of event: started, completed, or error';
comment on column public.run_events.organization_id is 'Organization for multi-tenant scoping; must match runs.organization_id';

create index if not exists idx_run_events_run_id_event_at on public.run_events (run_id, event_at desc);
create index if not exists idx_run_events_organization_id on public.run_events (organization_id, event_at desc);

create or replace function public.trg_reject_update_run_events()
returns trigger
language plpgsql
as $$
begin
  raise exception 'run_events rows are immutable and cannot be updated';
end;
$$;

create trigger run_events_prevent_update
before update on public.run_events
for each row
execute function public.trg_reject_update_run_events();

-- 4) Derived view projecting workflow_run_status per design session
create or replace view public.run_status_by_design_session as
with latest_events as (
  select
    r.design_session_id,
    r.organization_id,
    re.run_id,
    re.event_type,
    re.event_at,
    row_number() over (partition by re.run_id order by re.event_at desc, re.id desc) as row_rank
  from public.run_events re
  join public.runs r on r.id = re.run_id
),
current_run_state as (
  select
    design_session_id,
    organization_id,
    run_id,
    event_at,
    case
      when event_type = 'error' then 'error'
      when event_type = 'completed' then 'success'
      else 'pending'
    end::public.workflow_run_status as status
  from latest_events
  where row_rank = 1
),
aggregated_by_session as (
  select
    design_session_id,
    organization_id,
    max(event_at) as last_event_at,
    case
      when bool_or(status = 'error') then 'error'
      when bool_or(status = 'pending') then 'pending'
      else 'success'
    end::public.workflow_run_status as status
  from current_run_state
  group by design_session_id, organization_id
)
select
  coalesce(agg.status, 'pending'::public.workflow_run_status) as status,
  agg.last_event_at,
  ds.organization_id,
  'Derived in migration 20251023120000_add_workflow_status_to_design_sessions.sql'::text as derived_from_sql,
  ds.id as design_session_id
from public.design_sessions ds
left join aggregated_by_session agg
  on agg.design_session_id = ds.id
  and agg.organization_id = ds.organization_id;

comment on view public.run_status_by_design_session is 'Read-only view (represented as a table definition for schema tooling) that derives a design_session''s current status from immutable run_events without mutating state. The view is computed by taking the latest event per run and collapsing per design_session to determine if any error exists, else if any in-progress (pending) exists, else success.';
comment on column public.run_status_by_design_session.status is 'Derived aggregate status for the design session: pending, success, or error';
comment on column public.run_status_by_design_session.last_event_at is 'Timestamp of the most recent run event considered when deriving status';
comment on column public.run_status_by_design_session.organization_id is 'Organization owning the design session for multi-tenant scoping; included to ensure derived status is scoped correctly';
comment on column public.run_status_by_design_session.derived_from_sql is 'Developer note: SQL used to define this view; this table represents the schema of the read-only view ''run_status_by_design_session'' and documents the derivation logic; do not mutate';
comment on column public.run_status_by_design_session.design_session_id is 'Identifier of the design session for which we derive the current Run status (one row per design_session)';

-- 5) Backfill runs and run_events using legacy design_sessions columns before dropping them
do $$
declare
  column_exists boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'design_sessions'
      and column_name = 'status'
  )
  into column_exists;

  if column_exists then
    execute $run_insert$
      with source as (
        select
          ds.id as design_session_id,
          ds.organization_id,
          ds.created_by_user_id,
          coalesce(ds.started_at, ds.created_at) as derived_started_at,
          coalesce(ds.finished_at, ds.started_at, ds.created_at) as derived_finished_at,
          ds.status::text as status_text
        from public.design_sessions ds
        where not exists (
          select 1
          from public.runs r
          where r.design_session_id = ds.id
        )
      )
      insert into public.runs (
        ended_at,
        started_at,
        organization_id,
        design_session_id,
        created_by_user_id
      )
      select
        case
          when source.status_text = 'running' then null
          else source.derived_finished_at
        end,
        source.derived_started_at,
        source.organization_id,
        source.design_session_id,
        source.created_by_user_id
      from source;
    $run_insert$;

    execute $run_started$
      insert into public.run_events (run_id, event_at, event_type, organization_id)
      select
        r.id,
        r.started_at,
        'started',
        r.organization_id
      from public.runs r
      where not exists (
        select 1
        from public.run_events re
        where re.run_id = r.id
          and re.event_type = 'started'
      );
    $run_started$;

    execute $run_terminal$
      insert into public.run_events (run_id, event_at, event_type, organization_id)
      select
        r.id,
        coalesce(ds.finished_at, r.started_at),
        case
          when ds.status::text = 'completed' then 'completed'
          else 'error'
        end,
        r.organization_id
      from public.runs r
      join public.design_sessions ds on ds.id = r.design_session_id
      where ds.status::text in ('completed', 'error')
        and not exists (
          select 1
          from public.run_events re
          where re.run_id = r.id
            and re.event_type = case
              when ds.status::text = 'completed' then 'completed'
              else 'error'
            end
        );
    $run_terminal$;

    execute $run_update$
      update public.runs r
      set ended_at = coalesce(ds.finished_at, r.started_at)
      from public.design_sessions ds
      where ds.id = r.design_session_id
        and ds.status::text in ('completed', 'error')
        and (r.ended_at is distinct from coalesce(ds.finished_at, r.started_at));
    $run_update$;
  end if;
end;
$$;

-- 6) Drop legacy status columns, index, and enum type
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'design_sessions'
      and column_name = 'status'
  ) then
    drop index if exists public.idx_design_sessions_status;
    alter table public.design_sessions
      drop column if exists status,
      drop column if exists started_at,
      drop column if exists finished_at;
  end if;

  if exists (select 1 from pg_type where typname = 'workflow_status') then
    drop type public.workflow_status;
  end if;
end;
$$;

-- 7) Ensure Supabase Realtime publications include new tables
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

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'run_events'
  ) then
    alter publication supabase_realtime add table public.run_events;
  end if;
end;
$$;

commit;
