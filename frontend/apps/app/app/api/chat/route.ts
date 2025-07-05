import { createHash } from 'node:crypto'
import { deepModelingWorkflowTask } from '@liam-hq/jobs'
import { idempotencyKeys } from '@trigger.dev/sdk'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import { createClient } from '@/libs/db/server'

const chatRequestSchema = v.object({
  userInput: v.pipe(v.string(), v.minLength(1, 'Message is required')),
  history: v.array(v.tuple([v.string(), v.string()])),
  organizationId: v.string(),
  buildingSchemaId: v.string(),
  latestVersionNumber: v.number(),
  designSessionId: v.pipe(v.string(), v.uuid('Invalid design session ID')),
})

export async function POST(request: Request) {
  const requestBody = await request.json()

  // Input validation using Valibot safeParse
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

  // Get current user ID from server-side auth
  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const userId = userData.user.id

  // Create payload with server-fetched user ID
  const jobPayload = {
    ...validationResult.output,
    userId,
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
