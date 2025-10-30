import type { SupabaseClient } from '@liam-hq/db'
import type { Database } from '@liam-hq/db/supabase/database.types'

export type LatestSessionRun = {
  design_session_id: string
  latest_run_id: string | null
  status: 'running' | 'completed' | 'error'
}

export type RawLatestSessionRun =
  Database['public']['Functions']['fetch_latest_session_runs']['Returns'][number]

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

  const { data, error } = await supabase.rpc('fetch_latest_session_runs', {
    session_ids: sessionIds,
  })

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
        latest_run_id: row.latest_run_id ?? null,
        status:
          row.status === 'completed' || row.status === 'error'
            ? row.status
            : 'running',
      },
    ]),
  )
}
