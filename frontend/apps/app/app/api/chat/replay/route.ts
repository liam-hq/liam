import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import {
  createGraph,
  createSupabaseRepositories,
  deepModelingReplayStream,
} from '@liam-hq/agent'
import { SSE_EVENTS } from '@liam-hq/agent/client'
import { toResultAsync } from '@liam-hq/db'
import { fromAsyncThrowable, fromValibotSafeParse } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { errAsync, okAsync } from 'neverthrow'
import { after, NextResponse } from 'next/server'
import * as v from 'valibot'
import { line } from '../../../../features/stream/utils/line'
import { withTimeoutAndAbort } from '../../../../features/stream/utils/withTimeoutAndAbort'
import { createClient } from '../../../../libs/db/server'

export const maxDuration = 800
const REPLAY_TIMEOUT_MS = 700000

const requestSchema = v.object({
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const requestBody = await request.json()

  const parsed = fromValibotSafeParse(requestSchema, requestBody)
  if (parsed.isErr()) {
    return NextResponse.json(
      { error: `Validation error: ${parsed.error.message}` },
      { status: 400 },
    )
  }
  const { designSessionId } = parsed.value

  const authResult = await fromAsyncThrowable(() =>
    supabase.auth.getUser(),
  )().andThen(({ data }) => {
    if (!data?.user) {
      return errAsync(new Error('Authentication required'))
    }
    return okAsync(data.user)
  })

  if (authResult.isErr()) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const userId = authResult.value.id

  const buildingSchemaResult = await toResultAsync<{
    id: string
    organization_id: string
  }>(
    supabase
      .from('building_schemas')
      .select('id, organization_id')
      .eq('design_session_id', designSessionId)
      .limit(1)
      .maybeSingle(),
  )

  if (buildingSchemaResult.isErr()) {
    return NextResponse.json(
      { error: 'Building schema not found for design session' },
      { status: 404 },
    )
  }

  const { id: buildingSchemaId, organization_id: organizationId } =
    buildingSchemaResult.value

  const repositories = createSupabaseRepositories(supabase, organizationId)
  const checkpointer = repositories.schema.checkpointer

  const findLatestCheckpointId = async (): Promise<string | null> => {
    const graph = createGraph(checkpointer)

    const state = await graph.getState({
      configurable: { thread_id: designSessionId },
    })
    const checkpointId = state.config?.configurable?.checkpoint_id
    return typeof checkpointId === 'string' ? checkpointId : null
  }

  const updateDesignSessionStatus = async (fields: Record<string, unknown>) => {
    const { error } = await supabase
      .from('design_sessions')
      .update(fields)
      .eq('id', designSessionId)

    if (error) {
      Sentry.captureException(error, {
        tags: { designSessionId },
      })
    }
  }

  const markRunning = () =>
    updateDesignSessionStatus({
      status: 'running',
      started_at: new Date().toISOString(),
      finished_at: null,
    })
  const markCompleted = () =>
    updateDesignSessionStatus({
      status: 'completed',
      finished_at: new Date().toISOString(),
    })

  const enc = new TextEncoder()

  const processReplayEvents = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
  ) => {
    const checkpointId = await findLatestCheckpointId()

    if (!checkpointId) {
      const message = 'No checkpoint found for replay'
      controller.enqueue(enc.encode(line(SSE_EVENTS.ERROR, { message })))
      return
    }

    const replayParams = {
      organizationId,
      buildingSchemaId,
      designSessionId,
      userId,
      repositories,
      threadId: designSessionId,
      signal,
      checkpointId,
    }

    const events = await deepModelingReplayStream(checkpointer, replayParams)

    for await (const ev of events) {
      if (signal.aborted) {
        controller.enqueue(
          enc.encode(
            line(SSE_EVENTS.ERROR, { message: 'Request was aborted' }),
          ),
        )
        break
      }

      controller.enqueue(enc.encode(line(ev.event, ev.data)))
    }

    controller.enqueue(enc.encode(line(SSE_EVENTS.END, null)))
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await markRunning()
      try {
        const result = await withTimeoutAndAbort(
          (signal: AbortSignal) => processReplayEvents(controller, signal),
          REPLAY_TIMEOUT_MS,
          request.signal,
        )

        if (result.isErr()) {
          const err = result.error
          Sentry.captureException(err, {
            tags: { designSchemaId: designSessionId },
          })

          controller.enqueue(
            enc.encode(line(SSE_EVENTS.ERROR, { message: err.message })),
          )
        }
      } finally {
        await markCompleted()
        controller.close()
      }
    },
  })

  after(async () => {
    await awaitAllCallbacks()
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
