import type { SupabaseClient } from '@liam-hq/db'
import type { Database } from '@liam-hq/db/supabase/database.types'

export type LatestSessionRun = {
  design_session_id: string
  run_id: string
  latest_status: 'running' | 'completed' | 'error'
}

type RawLatestSessionRun = {
  design_session_id: string
  run_id: string
  latest_status: Database['public']['Enums']['workflow_run_status']
}

type FetchLatestSessionRunMapOptions = {
  context: string
}

export const fetchLatestSessionRunMap = async (
  supabase: SupabaseClient<Database>,
  sessionIds: string[],
  options: FetchLatestSessionRunMapOptions,
): Promise<Map<string, LatestSessionRun>> => {
  if (sessionIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase.rpc(
    'fetch_latest_session_runs_status',
    {
      session_ids: sessionIds,
    },
  )

  if (error) {
    console.error(
      `Error fetching latest session runs (${options.context}):`,
      error,
    )
    return new Map()
  }

  const rows: RawLatestSessionRun[] = Array.isArray(data) ? data : []

  return new Map(
    rows.map((row) => [
      row.design_session_id,
      {
        design_session_id: row.design_session_id,
        run_id: row.run_id,
        latest_status:
          row.latest_status === 'completed' || row.latest_status === 'error'
            ? row.latest_status
            : 'running',
      },
    ]),
  )
}
