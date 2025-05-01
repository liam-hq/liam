import { createClient } from '@/libs/db/server'
import { getRepositoryCommits } from '@liam-hq/github'
import { type NextRequest, NextResponse } from 'next/server'

export type Commit = {
  sha: string
  shortSha: string // First 8 characters
  date: string
  message: string
  author: string
}

// biome-ignore lint/suspicious/noExplicitAny: needed for poc
export async function GET(_request: NextRequest, context: any) {
  const { projectId, branch } = (await context.params) as {
    projectId: string
    branch: string
  }

  try {
    const supabase = await createClient()

    // Fetch project and repository information
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_repository_mappings (
          github_repositories (
            id,
            name,
            owner,
            github_installation_identifier
          )
        )
      `)
      .eq('id', projectId)
      .single()

    if (error || !project) {
      console.error('Error fetching project:', error)
      return NextResponse.json({ commits: [] }, { status: 404 })
    }

    if (
      !project.project_repository_mappings ||
      project.project_repository_mappings.length === 0 ||
      !project.project_repository_mappings[0].github_repositories
    ) {
      console.error('Repository information not found')
      return NextResponse.json({ commits: [] }, { status: 404 })
    }

    const repository =
      project.project_repository_mappings[0].github_repositories

    // Fetch commit list
    const commits = await getRepositoryCommits(
      Number(repository.github_installation_identifier),
      repository.owner,
      repository.name,
      branch,
      100, // Fetch up to 100 commits
    )

    if (!commits || commits.length === 0) {
      return NextResponse.json({ commits: [] }, { status: 200 })
    }

    // Format and return commit information
    const formattedCommits = commits.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 8),
      date: commit.date,
      message: commit.message,
      author: commit.author,
    }))

    return NextResponse.json({ commits: formattedCommits }, { status: 200 })
  } catch (error) {
    console.error('Error in getCommits API:', error)
    return NextResponse.json({ commits: [] }, { status: 500 })
  }
}
