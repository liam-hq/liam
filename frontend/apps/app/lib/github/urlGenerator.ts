/**
 * Utility functions for generating GitHub URLs
 * These functions create links to specific files and lines in the GitHub repository
 */

/**
 * Generates a GitHub URL for a specific file and line number
 * @param filePath The path to the file relative to the repository root
 * @param lineNumber Optional line number to link to
 * @param repository Optional repository name (e.g., "owner/repo")
 * @param branch Optional branch name
 * @returns A GitHub URL pointing to the specified file and line
 */
export function generateGitHubUrl(
  filePath: string,
  lineNumber?: number,
  repository?: string,
  branch?: string,
): string {
  // Use provided repository or fall back to environment variable or default
  const repoUrl = repository
    ? `https://github.com/${repository}/blob/`
    : process.env.GITHUB_REPO_URL || 'https://github.com/liam-hq/liam/blob/'

  // Use provided branch or fall back to environment variable or default
  const branchName = branch || process.env.GITHUB_BRANCH || 'main'

  let url = `${repoUrl}${branchName}/${filePath}?plain=1`

  // Add line number reference if provided
  if (lineNumber) {
    url += `#L${lineNumber}`
  }

  return url
}

/**
 * Formats a document reference as a markdown link to GitHub
 * @param source The source file path
 * @param line Optional line number
 * @param repository Optional repository name (e.g., "owner/repo")
 * @param branch Optional branch name
 * @returns A formatted markdown link
 */
export function formatGitHubReference(
  source: string,
  line?: number,
  repository?: string,
  branch?: string,
): string {
  const url = generateGitHubUrl(source, line, repository, branch)
  const displayName = source.split('/').pop() || source

  return `[${displayName}${line ? ` line ${line}` : ''}](${url})`
}
