import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'

import { NextResponse } from 'next/server'
import * as v from 'valibot'

const paramsSchema = v.object({
  id: v.string(),
})

const updateRequestSchema = v.object({
  schema: v.any(),
})

export async function GET(
  _request: Request,
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

  const { data: buildingSchema, error } = await supabase
    .from('building_schemas')
    .select('schema')
    .eq('design_session_id', parsedParams.output.id)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching schema:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schema' },
      { status: 500 },
    )
  }

  return NextResponse.json(buildingSchema)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const requestParams = await request.json()
  const parsedRequestParams = v.safeParse(updateRequestSchema, requestParams)

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

  const { schema } = parsedRequestParams.output

  const { data: updatedSchema, error: updateError } = await supabase
    .from('building_schemas')
    .update({ schema: JSON.parse(JSON.stringify(schema)) })
    .eq('design_session_id', parsedParams.output.id)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating schema:', updateError)
    return NextResponse.json(
      { error: 'Failed to update schema' },
      { status: 500 },
    )
  }

  return NextResponse.json(updatedSchema)
}
