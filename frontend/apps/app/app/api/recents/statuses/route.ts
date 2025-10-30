import { NextResponse } from 'next/server'
import { createClient } from '../../../../libs/db/server'
import type {
  LatestSessionRun,
  RawLatestSessionRun,
} from '../../../../libs/runs/fetchLatestSessionRuns'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { sessionIds } = (await request.json()) as {
    sessionIds?: unknown
  }

  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return NextResponse.json<LatestSessionRun[]>([])
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'fetch_latest_session_runs_status',
    { session_ids: sessionIds },
  )

  if (error) {
    console.error('Failed to fetch latest session runs:', error)
    return NextResponse.json<LatestSessionRun[]>([], { status: 500 })
  }

  const rows: RawLatestSessionRun[] = Array.isArray(data) ? data : []

  const normalized = rows.map((row) => ({
    design_session_id: row.design_session_id,
    latest_run_id: row.latest_run_id,
    status: row.status,
  }))

  return NextResponse.json(normalized)
}
