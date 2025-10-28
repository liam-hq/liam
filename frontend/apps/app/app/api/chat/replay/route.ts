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
import { RunTracker } from '../../../../libs/runs/runService'

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

  const { data: designSession, error: designSessionError } = await supabase
    .from('design_sessions')
    .select('organization_id')
    .eq('id', designSessionId)
    .limit(1)
    .single()

  if (designSessionError || !designSession) {
    return NextResponse.json(
      { error: 'Design Session not found' },
      { status: 404 },
    )
  }

  const organizationId = designSession.organization_id

  let runTracker: RunTracker | null = null

  const recordRunError = async (
    context?: Record<string, unknown>,
  ): Promise<void> => {
    if (!runTracker) return
    const tracker = runTracker
    const failResult = await fromAsyncThrowable(() => tracker.fail())()
    if (failResult.isErr()) {
      Sentry.captureException(failResult.error, {
        tags: { designSessionId },
        extra: { location: 'chat/replay run fail', context },
      })
    }
  }

  const recordRunSuccess = async () => {
    if (!runTracker) return
    const tracker = runTracker
    const completeResult = await fromAsyncThrowable(() => tracker.complete())()
    if (completeResult.isErr()) {
      Sentry.captureException(completeResult.error, {
        tags: { designSessionId },
        extra: { location: 'chat/replay run complete' },
      })
    }
  }

  const runTrackerResult = await fromAsyncThrowable(() =>
    RunTracker.start({
      supabase,
      designSessionId,
      organizationId,
      userId,
    }),
  )()

  if (runTrackerResult.isErr()) {
    Sentry.captureException(runTrackerResult.error, {
      tags: { designSessionId },
      extra: { location: 'chat/replay run start' },
    })
    runTracker = null
  } else {
    runTracker = runTrackerResult.value
  }

  let shouldMarkError = false
  let runErrorContext: Record<string, unknown> | null = null

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
    shouldMarkError = true
    await recordRunError({
      reason: 'building_schema_not_found',
    })

    return NextResponse.json(
      { error: 'Building schema not found for design session' },
      { status: 404 },
    )
  }

  const { id: buildingSchemaId } = buildingSchemaResult.value

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

  const enc = new TextEncoder()

  const processReplayEvents = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
  ) => {
    const checkpointId = await findLatestCheckpointId()

    if (!checkpointId) {
      shouldMarkError = true
      runErrorContext = {
        reason: 'checkpoint_not_found',
      }
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
      if (ev.event === SSE_EVENTS.ERROR) {
        shouldMarkError = true
        runErrorContext = { reason: 'sse_error' }
      }

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
      await withTimeoutAndAbort(
        (signal: AbortSignal) => processReplayEvents(controller, signal),
        REPLAY_TIMEOUT_MS,
        request.signal,
      ).mapErr((err) => {
        // allow replay to recover after abort
        const message = err.message?.toLowerCase() ?? ''
        const isAbortError =
          err.name === 'AbortError' ||
          message.includes('abort') ||
          message.includes('timeout')

        if (!isAbortError) {
          shouldMarkError = true
          runErrorContext = {
            reason: 'workflow_error',
            message: err.message,
          }
        }

        Sentry.captureException(err, {
          tags: { designSchemaId: designSessionId },
        })

        controller.enqueue(
          enc.encode(line(SSE_EVENTS.ERROR, { message: err.message })),
        )

        return err
      })

      if (shouldMarkError) {
        await recordRunError(
          runErrorContext ?? {
            reason: 'workflow_error',
          },
        )
      } else {
        await recordRunSuccess()
      }
      controller.close()
    },
  })

  after(async () => {
    await awaitAllCallbacks()
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  if (runTracker) {
    headers.set('x-run-id', runTracker.id)
  }

  return new Response(stream, {
    headers,
  })
}
