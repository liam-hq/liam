/**
 * Utility functions for generating GitHub URLs
 * These functions create links to specific files and lines in the GitHub repository
 */

/**
 * Generates a GitHub URL for a specific file and line number
 * @param filePath The path to the file relative to the repository root
 * @param lineNumber Optional line number to link to
 * @returns A GitHub URL pointing to the specified file and line
 */
export function generateGitHubUrl(
  filePath: string,
  lineNumber?: number,
): string {
  const baseUrl =
    process.env.GITHUB_REPO_URL || 'https://github.com/liam-hq/liam/blob/'
  const branch = process.env.GITHUB_BRANCH || 'main'

  let url = `${baseUrl}${branch}/${filePath}?plain=1`
  if (lineNumber) {
    url += `#L${lineNumber}`
  }

  return url
}

/**
 * Formats a document reference as a markdown link to GitHub
 * @param source The source file path
 * @param line Optional line number
 * @returns A formatted markdown link
 */
export function formatGitHubReference(source: string, line?: number): string {
  const url = generateGitHubUrl(source, line)
  const displayName = source.split('/').pop() || source

  return `[${displayName}${line ? ` line ${line}` : ''}](${url})`
}
