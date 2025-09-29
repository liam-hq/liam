import { awaitAllCallbacks } from '@langchain/core/callbacks/promises'
import {
  type AgentWorkflowParams,
  createSupabaseRepositories,
  deepModelingStream,
  invokeDbAgentStream,
} from '@liam-hq/agent'
import { SSE_EVENTS } from '@liam-hq/agent/client'
import * as Sentry from '@sentry/nextjs'
import { after, NextResponse } from 'next/server'
import * as v from 'valibot'
import { withTimeoutAndAbort } from '../../../../features/stream/utils/withTimeoutAndAbort'
import { createClient } from '../../../../libs/db/server'

function line(event: string, data: unknown) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  return `event:${event}\ndata:${payload}\n\n`
}

// https://vercel.com/docs/functions/configuring-functions/duration#maximum-duration-for-different-runtimes
export const maxDuration = 800
const TIMEOUT_MS = 120000000

const chatRequestSchema = v.object({
  userInput: v.pipe(v.string(), v.minLength(1, 'Message is required')),
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
  isDeepModelingEnabled: v.optional(v.boolean(), true),
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

  const organizationId = designSession.organization_id

  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .select('id')
    .eq('design_session_id', designSessionId)
    .single()
  if (buildingSchemaError) {
    return NextResponse.json(
      { error: 'Building schema not found for design session' },
      { status: 404 },
    )
  }

  const repositories = createSupabaseRepositories(supabase, organizationId)
  const result = await repositories.schema.getSchema(designSessionId)

  if (result.isErr()) {
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
      buildingSchemaId: buildingSchema.id,
      designSessionId,
      userId,
      signal,
    }

    const events = validationResult.output.isDeepModelingEnabled
      ? await deepModelingStream(params, config)
      : await invokeDbAgentStream(params, config)

    for await (const ev of events) {
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
        Sentry.captureException(err, {
          tags: { designSchemaId: designSessionId },
        })

        controller.enqueue(
          enc.encode(line(SSE_EVENTS.ERROR, { message: err.message })),
        )
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
