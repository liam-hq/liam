import { createClient } from '@/libs/db/server'
import { getRepositoriesByInstallationId } from '@liam-hq/github'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const installationId = Number(searchParams.get('installationId'))

  if (!installationId) {
    return NextResponse.json(
      { error: 'Installation ID is required' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const session = data.session

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await getRepositoriesByInstallationId(session, installationId)
    return NextResponse.json(res.repositories)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 },
    )
  }
}
