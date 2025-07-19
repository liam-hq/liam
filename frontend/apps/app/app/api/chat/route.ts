import { createHash } from 'node:crypto'
import {
  type DeepModelingPayload,
  deepModelingWorkflowTask,
} from '@liam-hq/jobs'
import { idempotencyKeys } from '@trigger.dev/sdk'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import { createClient } from '@/libs/db/server'

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

  const { data: designSession, error: designSessionError } = await supabase
    .from('design_sessions')
    .select('organization_id')
    .eq('id', validationResult.output.designSessionId)
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
    .eq('design_session_id', validationResult.output.designSessionId)
    .single()

  if (buildingSchemaError) {
    return NextResponse.json(
      { error: 'Building schema not found for design session' },
      { status: 404 },
    )
  }

  const { data: latestVersion, error: latestVersionError } = await supabase
    .from('building_schema_versions')
    .select('number')
    .eq('building_schema_id', buildingSchema.id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVersionError || !latestVersion) {
    return NextResponse.json(
      { error: 'Latest version not found for building schema' },
      { status: 404 },
    )
  }

  const { data: timelineItems, error: timelineItemsError } = await supabase
    .from('timeline_items')
    .select('type, content')
    .eq('design_session_id', validationResult.output.designSessionId)
    .order('created_at', { ascending: true })

  if (timelineItemsError) {
    return NextResponse.json(
      { error: 'Failed to fetch timeline items' },
      { status: 500 },
    )
  }

  const history: [string, string][] = timelineItems.map((item) => [
    item.type === 'user' ? 'Human' : 'AI',
    item.content,
  ])

  const jobPayload: DeepModelingPayload = {
    ...validationResult.output,
    userId,
    organizationId: organizationId ?? undefined,
    latestVersionNumber: latestVersion.number,
    buildingSchemaId: buildingSchema.id,
    history,
  }

  // Generate idempotency key based on the payload
  // This ensures the same request won't be processed multiple times
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(jobPayload))
    .digest('hex')

  const idempotencyKey = await idempotencyKeys.create(
    `chat-${validationResult.output.designSessionId}-${payloadHash}`,
  )

  // Trigger the Deep Modeling workflow with idempotency key
  await deepModelingWorkflowTask.trigger(jobPayload, {
    idempotencyKey,
  })

  return NextResponse.json({
    success: true,
  })
}
