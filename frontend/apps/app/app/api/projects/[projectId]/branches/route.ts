import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { createClient } from '@/libs/db/server'
import { getRepositoryBranches } from '@liam-hq/github'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } },
) {
  const { projectId } = params

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 },
    )
  }

  try {
    // Get Supabase client and current user
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    // Get organization ID
    const organizationId = await getOrganizationId()
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 },
      )
    }

    // Get repository information for the project
    const { data: mapping, error: mappingError } = await supabase
      .from('project_repository_mappings')
      .select(`
        github_repositories(
          id, name, owner, github_installation_identifier
        )
      `)
      .eq('project_id', projectId)
      .single()

    if (mappingError || !mapping) {
      return NextResponse.json(
        { error: 'Project repository not found' },
        { status: 404 },
      )
    }

    const repository = mapping.github_repositories

    // Get branches from GitHub API
    const branches = await getRepositoryBranches(
      Number(repository.github_installation_identifier),
      repository.owner,
      repository.name,
    )

    const formattedBranches = branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
    }))

    return NextResponse.json(formattedBranches)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 },
    )
  }
}
