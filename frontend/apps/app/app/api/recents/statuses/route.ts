import { NextResponse } from 'next/server'
import { createClient } from '../../../../libs/db/server'
import type { LatestSessionRun } from '../../../../libs/runs/fetchLatestSessionRuns'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isLatestSessionRun = (value: unknown): value is LatestSessionRun => {
  if (!isRecord(value)) {
    return false
  }

  const runId = value['run_id']
  const status = value['latest_status']

  return (
    typeof value['design_session_id'] === 'string' &&
    (typeof runId === 'string' || runId === null) &&
    (status === 'running' || status === 'completed' || status === 'error')
  )
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json()
  const sessionIds = isRecord(body) ? body.sessionIds : undefined

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

  const rows = Array.isArray(data) ? data.filter(isLatestSessionRun) : []

  return NextResponse.json(rows)
}
