import {
  type AgentWorkflowParams,
  createSupabaseRepositories,
  deepModeling,
  invokeDbAgent,
} from '@liam-hq/agent'
import { okAsync } from 'neverthrow'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import { createClient } from '@/libs/db/server'

const chatRequestSchema = v.object({
  userInput: v.pipe(v.string(), v.minLength(1, 'Message is required')),
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
  isDeepModelingEnabled: v.optional(v.boolean(), true),
})

// https://vercel.com/docs/functions/configuring-functions/duration#maximum-duration-for-different-runtimes
export const maxDuration = 800

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

  const repositories = createSupabaseRepositories(supabase, organizationId)
  const userMessageResult = await repositories.schema.createTimelineItem({
    designSessionId: validationResult.output.designSessionId,
    content: validationResult.output.userInput,
    type: 'user',
    userId,
  })

  if (!userMessageResult.success) {
    console.error('Failed to save user message:', userMessageResult.error)
    return NextResponse.json(
      {
        error: 'Failed to save user message',
        details: userMessageResult.error,
      },
      { status: 500 },
    )
  }

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

  const { data: latestVersion, error: latestVersionError } = await supabase
    .from('building_schema_versions')
    .select('number')
    .eq('building_schema_id', buildingSchema.id)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVersionError) {
    return NextResponse.json(
      { error: 'Error fetching latest version' },
      { status: 500 },
    )
  }

  // If no version exists yet (initial state), use 0 as the version number
  const latestVersionNumber = latestVersion?.number ?? 0

  const result = await repositories.schema
    .getSchema(designSessionId)
    .andThen((data) => {
      const params: AgentWorkflowParams = {
        userInput: validationResult.output.userInput,
        schemaData: data.schema,
        organizationId,
        buildingSchemaId: buildingSchema.id,
        latestVersionNumber: latestVersionNumber,
        designSessionId: designSessionId,
        userId,
      }

      const config = {
        configurable: {
          repositories,
          thread_id: designSessionId,
        },
      }

      return okAsync({ params, config })
    })
    .andThen(({ params, config }) => {
      const workflow = validationResult.output.isDeepModelingEnabled
        ? deepModeling
        : invokeDbAgent

      return workflow(params, config)
    })

  return NextResponse.json({
    success: result.isOk(),
    error: result.isErr() ? result.error.message : undefined,
  })
}
