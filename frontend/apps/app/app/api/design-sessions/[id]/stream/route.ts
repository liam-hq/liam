import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import type { Schema } from '@liam-hq/db-structure'
import { NextResponse } from 'next/server'
import * as v from 'valibot'

const requestParamsSchema = v.object({
  messages: v.array(
    v.object({
      role: v.union([v.literal('user'), v.literal('assistant')]),
      content: v.string(),
    }),
  ),
})

const paramsSchema = v.object({
  id: v.string(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 },
    )
  }

  const requestParams = await request.json()
  const parsedRequestParams = v.safeParse(requestParamsSchema, requestParams)

  if (!parsedRequestParams.success) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const organizationId = await getOrganizationId()
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 400 },
    )
  }

  const { data: buildingSchema, error: schemaError } = await supabase
    .from('building_schemas')
    .select('schema')
    .eq('design_session_id', parsedParams.output.id)
    .eq('organization_id', organizationId)
    .single()

  if (schemaError) {
    console.error('Error fetching schema:', schemaError)
    return NextResponse.json(
      { error: 'Failed to fetch schema' },
      { status: 500 },
    )
  }

  const schema = buildingSchema.schema as Schema
  const { messages } = parsedRequestParams.output

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const mockResponse = `Based on your request, I'll help you design the database schema. Here's what I suggest:

## Current Schema Analysis
The current schema has ${Object.keys(schema.tables || {}).length} tables defined.

## Recommendations
1. Consider adding proper relationships between entities
2. Ensure all tables have primary keys
3. Add appropriate indexes for performance

Would you like me to help you with any specific changes to the schema?`

      const chunks = mockResponse.split(' ')
      let index = 0

      const sendChunk = () => {
        if (index < chunks.length) {
          const chunk = chunks[index] + ' '
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          index++
          setTimeout(sendChunk, 50)
        } else {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      }

      sendChunk()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
