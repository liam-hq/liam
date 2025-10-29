import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import {
  type AgentWorkflowParams,
  createSupabaseRepositories,
  deepModelingStream,
} from '@liam-hq/agent'
import { SSE_EVENTS } from '@liam-hq/agent/client'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { after, NextResponse } from 'next/server'
import * as v from 'valibot'
import { line } from '../../../../features/stream/utils/line'
import { withTimeoutAndAbort } from '../../../../features/stream/utils/withTimeoutAndAbort'
import { createClient } from '../../../../libs/db/server'
import { RunTracker } from '../../../../libs/runs/runService'

// https://vercel.com/docs/functions/configuring-functions/duration#maximum-duration-for-different-runtimes
export const maxDuration = 800
const TIMEOUT_MS = 700000

const chatRequestSchema = v.object({
  userInput: v.pipe(v.string(), v.minLength(1, 'Message is required')),
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
})

export async function POST(request: Request) {
  const requestBody = await request.json()
  const validationResult = v.safeParse(chatRequestSchema, requestBody)

  if (!validationResult.success) {
    const errorMessage = validationResult.issues
      .map((issue) => issue.message)
      .join(', ')
    return NextResponse.json(
      { error: `Validation error: ${errorMessage}` },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  // Get current user ID from server-side auth
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const userId = userData.user.id
  const designSessionId = validationResult.output.designSessionId
  const { data: designSession, error: designSessionError } = await supabase
    .from('design_sessions')
    .select('organization_id')
    .eq('id', designSessionId)
    .limit(1)
    .single()
  if (designSessionError) {
    return NextResponse.json(
      { error: 'Design Session not found' },
      { status: 404 },
    )
  }

  let shouldMarkError = false
  let runErrorContext: Record<string, unknown> | null = null

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
        level: 'warning',
        extra: {
          location: 'chat/stream run fail',
          context,
        },
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
        level: 'warning',
        extra: { location: 'chat/stream run complete' },
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
      level: 'warning',
      extra: { location: 'chat/stream run start' },
    })
    runTracker = null
  } else {
    runTracker = runTrackerResult.value
  }

  const repositories = createSupabaseRepositories(supabase, organizationId)
  const result = await repositories.schema.getSchema(designSessionId)

  if (result.isErr()) {
    await recordRunError({
      reason: 'schema_fetch_failed',
      message: result.error.message,
    })
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  const config = {
    configurable: {
      repositories,
      thread_id: designSessionId,
    },
  }

  const enc = new TextEncoder()

  const processEvents = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
  ) => {
    const params: AgentWorkflowParams = {
      userInput: validationResult.output.userInput,
      schemaData: result.value.schema,
      organizationId,
      designSessionId,
      userId,
      signal,
    }

    const events = await deepModelingStream(params, config)

    for await (const ev of events) {
      if (ev.event === SSE_EVENTS.ERROR) {
        shouldMarkError = true
        runErrorContext = { reason: 'sse_error' }
      }

      // Check if request was aborted during iteration
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
      const result = await withTimeoutAndAbort(
        (signal: AbortSignal) => processEvents(controller, signal),
        TIMEOUT_MS,
        request.signal,
      )

      if (result.isErr()) {
        const err = result.error
        const message = err.message?.toLowerCase() ?? ''
        const isAbortError =
          err.name === 'AbortError' ||
          message.includes('abort') ||
          message.includes('timeout') // allow replay to recover after abort

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
      }

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
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
