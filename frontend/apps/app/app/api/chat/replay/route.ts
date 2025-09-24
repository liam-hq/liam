import {
  createDbAgentGraph,
  createGraph,
  createSupabaseRepositories,
  dbAgentReplayStream,
  deepModelingReplayStream,
} from '@liam-hq/agent'
import { SSE_EVENTS } from '@liam-hq/agent/client'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import {
  line,
  maxDuration,
  streamWithTimeout,
} from '../../../../features/stream/utils'
import { createClient } from '../../../../libs/db/server'

// Export maxDuration for Next.js
export { maxDuration }

const replayRequestSchema = v.object({
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
  isDeepModelingEnabled: v.optional(v.boolean(), true),
})

export async function POST(request: Request) {
  const requestBody = await request.json()
  const validationResult = v.safeParse(replayRequestSchema, requestBody)

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
  const checkpointer = repositories.schema.checkpointer

  const config = {
    configurable: {
      thread_id: designSessionId,
    },
  }

  const enc = new TextEncoder()

  const findLatestCheckpointId = async () => {
    const graph = validationResult.output.isDeepModelingEnabled
      ? createGraph(checkpointer)
      : createDbAgentGraph(checkpointer)

    const state = await graph.getState(config)
    return state.config?.configurable?.checkpoint_id ?? null
  }

  const processReplayEvents = async (
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
  ) => {
    const latestCheckpointId = await findLatestCheckpointId()

    if (!latestCheckpointId) {
      const message = 'No checkpoint found for replay'
      controller.enqueue(enc.encode(line(SSE_EVENTS.ERROR, { message })))
      return
    }

    const replayParams = {
      organizationId,
      buildingSchemaId: buildingSchema.id,
      designSessionId,
      userId,
      repositories,
      thread_id: designSessionId,
      recursionLimit: 50,
      signal,
      checkpoint_id: latestCheckpointId,
    }

    const events = validationResult.output.isDeepModelingEnabled
      ? await deepModelingReplayStream(checkpointer, replayParams)
      : await dbAgentReplayStream(checkpointer, replayParams)

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

  const stream = streamWithTimeout(processReplayEvents, {
    designSessionId,
    signal: request.signal,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
