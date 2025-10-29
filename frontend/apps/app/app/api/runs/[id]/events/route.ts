import { fromAsyncThrowable, fromValibotSafeParse } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import { createClient } from '../../../../../libs/db/server'
import { RunTracker } from '../../../../../libs/runs/runService'

const requestSchema = v.object({
  eventType: v.union([v.literal('error'), v.literal('completed')]),
  eventAt: v.optional(v.string()),
})

type RouteContext = {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const json = await request.json().catch(() => null)
  const parsed = fromValibotSafeParse(requestSchema, json)

  if (parsed.isErr()) {
    return NextResponse.json(
      { error: `Validation error: ${parsed.error.message}` },
      { status: 400 },
    )
  }

  const runId = params.id
  const { data: runData, error: runError } = await supabase
    .from('runs')
    .select('id, organization_id, design_session_id')
    .eq('id', runId)
    .maybeSingle()

  if (runError) {
    Sentry.captureException(runError, {
      tags: { runId },
      extra: { location: 'runs/[id]/events fetch run' },
    })
    return NextResponse.json({ error: 'Failed to fetch run' }, { status: 500 })
  }

  if (!runData) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  const tracker = RunTracker.resume({
    supabase,
    runId: runData.id,
    organizationId: runData.organization_id,
    userId: userData.user.id,
  })

  const eventAt = parsed.value.eventAt

  const eventResult = await fromAsyncThrowable(() =>
    parsed.value.eventType === 'error'
      ? tracker.fail(eventAt, userData.user.id)
      : tracker.complete(eventAt, userData.user.id),
  )()

  if (eventResult.isErr()) {
    Sentry.captureException(eventResult.error, {
      tags: { runId },
      extra: {
        location: 'runs/[id]/events append',
        eventType: parsed.value.eventType,
      },
    })
    return NextResponse.json(
      { error: 'Failed to record run event' },
      { status: 500 },
    )
  }

  const { data: statusData, error: statusError } = await supabase
    .from('run_status')
    .select('status, last_event_at, design_session_id')
    .eq('design_session_id', runData.design_session_id)
    .eq('organization_id', runData.organization_id)
    .maybeSingle()

  if (statusError) {
    Sentry.captureException(statusError, {
      tags: { runId },
      extra: { location: 'runs/[id]/events fetch status' },
    })
    return NextResponse.json(
      { error: 'Failed to fetch latest run status' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: statusData?.status ?? null,
    lastEventAt: statusData?.last_event_at ?? null,
    designSessionId: statusData?.design_session_id ?? runData.design_session_id,
    runId,
  })
}
