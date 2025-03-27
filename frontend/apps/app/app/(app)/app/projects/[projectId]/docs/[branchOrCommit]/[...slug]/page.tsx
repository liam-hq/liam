import type { PageProps } from '@/app/types'
import { createClient } from '@/libs/db/server'
import { getFileContent } from '@liam-hq/github'
import * as Sentry from '@sentry/nextjs'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

// Validation schema for route parameters
const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
  slug: v.array(v.string()),
})

/**
 * Fetches repository information for a given project
 */
const getRepositoryInfo = async (projectId: string) => {
  const supabase = await createClient()

  // Get project with repository and mapping in a single query
  const { data, error } = await supabase
    .from('Project')
    .select(`
      id,
      ProjectRepositoryMapping!inner (
        repositoryId,
        Repository!inner (
          owner,
          name,
          installationId
        )
      )
    `)
    .eq('id', Number(projectId))
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to fetch project data: ${error?.message || 'Unknown error'}`,
    )
  }

  const repository = data.ProjectRepositoryMapping[0]?.Repository

  if (
    !repository ||
    !repository.installationId ||
    !repository.owner ||
    !repository.name
  ) {
    throw new Error('Repository information not found')
  }

  return {
    fullName: `${repository.owner}/${repository.name}`,
    installationId: Number(repository.installationId),
  }
}

export default async function Page({ params }: PageProps) {
  // Validate route parameters
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw notFound()

  const { projectId, branchOrCommit, slug } = parsedParams.output
  const filePath = slug.join('/')

  try {
    // Get repository information
    const { fullName: repositoryFullName, installationId } =
      await getRepositoryInfo(projectId)

    // Fetch file content from GitHub
    const content = await getFileContent(
      repositoryFullName,
      filePath,
      branchOrCommit,
      installationId,
    )

    if (!content) {
      return (
        <div>
          <h1>File Not Found</h1>
          <p>The specified file could not be found in the repository.</p>
          <p>Please check the file path and branch/commit reference.</p>
        </div>
      )
    }

    // Simply render the text content
    return (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '1rem',
          fontFamily: 'monospace',
        }}
      >
        {content}
      </pre>
    )
  } catch (error) {
    // Log unexpected errors
    Sentry.captureException(error)

    return (
      <div>
        <h1>Error</h1>
        <p>Failed to fetch file content from GitHub</p>
        <p>Please check your repository permissions and try again.</p>
        <p>
          Error details:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }
}
