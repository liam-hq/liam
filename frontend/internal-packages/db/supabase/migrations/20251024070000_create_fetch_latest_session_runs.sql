create or replace function public.fetch_latest_session_runs_status(session_ids uuid[])
returns table (
  design_session_id uuid,
  run_id uuid,
  latest_status public.workflow_run_status
)
language sql
set search_path = public
as $$
  with latest_runs as (
    select
      r.design_session_id,
      r.id as run_id,
      row_number() over (partition by r.design_session_id order by r.started_at desc) as run_rank
    from runs r
    where r.design_session_id = any(session_ids)
  ),
  latest_events as (
    select distinct on (re.run_id)
      re.run_id,
      re.status
    from run_events re
    join latest_runs lr on lr.run_id = re.run_id
    order by re.run_id, re.created_at desc, re.id desc
  )
  select
    lr.design_session_id,
    lr.run_id,
    coalesce(le.status, 'running') as latest_status
  from latest_runs lr
  left join latest_events le on le.run_id = lr.run_id
  where lr.run_rank = 1;
$$;

grant execute on function public.fetch_latest_session_runs_status(uuid[]) to authenticated, service_role;
