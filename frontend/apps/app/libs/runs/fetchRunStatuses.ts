import type { SupabaseClientType } from '@liam-hq/db'

export type WorkflowRunStatus = 'running' | 'completed' | 'error'

export type RunStatusRecord = {
  designSessionId: string
  status: WorkflowRunStatus
  lastEventAt: string | null
}

type FetchRunStatusesOptions = {
  context?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const normalizeStatus = (status: string | null): WorkflowRunStatus => {
  if (status === 'error') {
    return 'error'
  }

  if (status === 'completed' || status === 'success') {
    return 'completed'
  }

  if (status === 'running' || status === 'pending') {
    return 'running'
  }

  return 'running'
}

const sanitizeRunStatusRow = (row: unknown): RunStatusRecord | null => {
  if (!isRecord(row)) {
    return null
  }

  const designSessionId = toStringOrNull(row.design_session_id)
  if (!designSessionId) {
    return null
  }

  const rawStatus = toStringOrNull(row.status)
  const lastEventAt = toStringOrNull(row.last_event_at)

  return {
    designSessionId,
    status: normalizeStatus(rawStatus),
    lastEventAt,
  }
}

const buildErrorContext = (context?: string): string =>
  context ? ` for ${context}` : ''

const fetchRunStatusRecords = async (
  supabase: SupabaseClientType,
  designSessionIds: string[],
  options: FetchRunStatusesOptions = {},
): Promise<RunStatusRecord[]> => {
  if (designSessionIds.length === 0) {
    return []
  }

  const { context } = options

  const { data, error } = await supabase
    .from('run_status')
    .select('design_session_id, status, last_event_at')
    .in('design_session_id', designSessionIds)

  if (error) {
    console.error(
      `Error fetching run statuses${buildErrorContext(context)}:`,
      error,
    )
    return []
  }

  const rows = Array.isArray(data) ? data : []

  return rows
    .map((row) => sanitizeRunStatusRow(row))
    .filter((row): row is RunStatusRecord => Boolean(row))
}

export const fetchRunStatusMap = async (
  supabase: SupabaseClientType,
  designSessionIds: string[],
  options: FetchRunStatusesOptions = {},
): Promise<Map<string, RunStatusRecord>> => {
  const records = await fetchRunStatusRecords(
    supabase,
    designSessionIds,
    options,
  )

  return records.reduce((map, record) => {
    map.set(record.designSessionId, record)
    return map
  }, new Map<string, RunStatusRecord>())
}
