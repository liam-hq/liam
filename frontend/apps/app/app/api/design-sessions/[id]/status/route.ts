import { fromValibotSafeParse } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import * as v from 'valibot'

import { createClient } from '../../../../../libs/db/server'

const requestSchema = v.object({
  status: v.union([
    v.literal('running'),
    v.literal('completed'),
    v.literal('error'),
  ]),
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

  const { status } = parsed.value
  const updates: Record<string, unknown> = { status }

  if (status === 'running') {
    updates.started_at = new Date().toISOString()
    updates.finished_at = null
  } else {
    updates.finished_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('design_sessions')
    .update(updates)
    .eq('id', params.id)
    .select('id')
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags: {
        designSessionId: params.id,
        location: 'design-session status API',
      },
    })

    return NextResponse.json(
      { error: 'Failed to update design session status' },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Design session not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true })
}
