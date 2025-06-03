import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import type { TablesInsert } from '@liam-hq/db/supabase/database.types'
import { NextResponse } from 'next/server'
import * as v from 'valibot'

const requestParamsSchema = v.object({
  content: v.string(),
  role: v.union([v.literal('user'), v.literal('assistant')]),
})

const paramsSchema = v.object({
  id: v.string(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
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

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('design_session_id', parsedParams.output.id)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    )
  }

  return NextResponse.json(messages)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
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

  const { content, role } = parsedRequestParams.output

  const messageData: TablesInsert<'messages'> = {
    design_session_id: parsedParams.output.id,
    organization_id: organizationId,
    content,
    role,
    user_id: userData.user.id,
    updated_at: new Date().toISOString(),
  }

  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  if (insertError) {
    console.error('Error creating message:', insertError)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 },
    )
  }

  return NextResponse.json(message, { status: 201 })
}
