// No type definitions needed here as we're using dynamic imports
// and TypeScript ignores for compatibility

// These will be dynamically imported at runtime
const getFileContent = async (
  repo: string,
  path: string,
  branch: string,
  installationId: number,
): Promise<{ content: string }> => {
  try {
    // @ts-ignore - Ignore TypeScript errors for dynamic import
    const module = await import('@liam-hq/github/src/api.server')
    const result = await module.getFileContent(
      repo,
      path,
      branch,
      installationId,
    )

    // Ensure content is a string
    if (result?.content) {
      return { content: result.content.toString() }
    }
    throw new Error(`Failed to get content for ${path}`)
  } catch (error) {
    console.error(`Error in getFileContent for ${path}:`, error)
    throw error
  }
}

/**
 * Creates an Octokit instance with the appropriate authentication
 * @param installationId The GitHub App installation ID
 * @returns Authenticated Octokit instance
 */
const createOctokit = async (installationId: number) => {
  try {
    // @ts-ignore - Ignore TypeScript errors for dynamic import
    const { Octokit } = await import('@octokit/rest')
    // @ts-ignore - Ignore TypeScript errors for dynamic import
    const { createAppAuth } = await import('@octokit/auth-app')

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env['GITHUB_APP_ID'],
        privateKey: process.env['GITHUB_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
        installationId,
      },
    })
  } catch (error) {
    console.error('Error creating Octokit instance:', error)
    throw error
  }
}

/**
 * Gets a list of files from a GitHub repository
 * @param projectId Repository identifier in format 'owner/repo'
 * @param installationId GitHub App installation ID
 * @param branch Branch to fetch files from (default: 'main')
 * @param fileExtensions Optional array of file extensions to filter by
 * @returns Array of file objects with path, content, and detected language
 */
export async function getRepositoryFiles(
  projectId: string,
  installationId: number,
  branch = 'main',
  fileExtensions?: string[],
): Promise<{ path: string; content: string; language: string }[]> {
  const [owner, repo] = projectId.split('/')
  if (!owner || !repo) {
    throw new Error('Invalid project ID format. Expected "owner/repo"')
  }

  const octokit = await createOctokit(installationId)
  const files: { path: string; content: string; language: string }[] = []

  // Get the repository tree recursively
  try {
    // First get the reference to the branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    })

    // Get the commit that the branch points to
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: refData.object.sha,
    })

    // Get the tree that the commit points to, recursively
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commitData.tree.sha,
      recursive: 'true',
    })

    // Filter for blob objects (files) and optionally by extension
    const fileItems = treeData.tree.filter((item) => {
      if (item.type !== 'blob') {
        return false
      }

      if (fileExtensions && fileExtensions.length > 0) {
        return fileExtensions.some((ext) => item.path?.endsWith(ext))
      }

      return true
    })

    // Process files in batches to avoid rate limiting
    const BATCH_SIZE = 10
    for (let i = 0; i < fileItems.length; i += BATCH_SIZE) {
      const batch = fileItems.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(async (item) => {
        if (!item.path) return null

        try {
          // Get file content
          const { content } = await getFileContent(
            `${owner}/${repo}`,
            item.path,
            branch,
            installationId,
          )

          if (content) {
            // We'll detect language in the next step
            return {
              path: item.path,
              content,
              language: '', // Will be filled by language detection
            }
          }
        } catch (error) {
          console.error(`Error fetching content for ${item.path}:`, error)
        }
        return null
      })

      const batchResults = await Promise.all(batchPromises)
      files.push(
        ...(batchResults.filter(Boolean) as {
          path: string
          content: string
          language: string
        }[]),
      )
    }

    return files
  } catch (error) {
    console.error(`Error fetching repository files for ${projectId}:`, error)
    throw new Error(`Failed to fetch repository files: ${error}`)
  }
}

/**
 * Gets information about the programming languages used in a repository
 * @param projectId Repository identifier in format 'owner/repo'
 * @param installationId GitHub App installation ID
 * @returns Object mapping language names to byte counts
 */
export async function getRepositoryLanguages(
  projectId: string,
  installationId: number,
): Promise<Record<string, number>> {
  const [owner, repo] = projectId.split('/')
  if (!owner || !repo) {
    throw new Error('Invalid project ID format. Expected "owner/repo"')
  }

  const octokit = await createOctokit(installationId)

  try {
    const { data: languages } = await octokit.repos.listLanguages({
      owner,
      repo,
    })

    return languages
  } catch (error) {
    console.error(
      `Error fetching repository languages for ${projectId}:`,
      error,
    )
    throw new Error(`Failed to fetch repository languages: ${error}`)
  }
}
