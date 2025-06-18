import { NextResponse } from 'next/server'
import { createClient } from '@/libs/db/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const organizationId = searchParams.get('organizationId')

  const supabase = await createClient()

  let dbQuery = supabase
    .from('projects')
    .select('id, name, created_at, updated_at, organization_id')
    .order('id', { ascending: false })

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }

  if (organizationId) {
    dbQuery = dbQuery.eq('organization_id', organizationId)
  }

  const { data: projects, error } = await dbQuery

  if (error) {
    console.error('Error searching projects:', error)
    return NextResponse.json(
      { error: 'Failed to search projects' },
      { status: 500 },
    )
  }

  return NextResponse.json(projects)
}
