/**
 * Formats a review issue into a standardized prompt format
 */
export function formatReviewIssue({
  category,
  severity,
  description,
  suggestion,
  snippets,
}: {
  category: string
  severity: string
  description: string
  suggestion: string
  snippets?: Array<{
    filename: string
    snippet: string
  }>
}): string {
  const issueDetails = `
- Category: ${category}
- Severity: ${severity}
- Issue: ${description}
- Suggestion: ${suggestion}`

  const promptText =
    severity === 'WARNING'
      ? `Please review the following warning and determine if optimization is necessary. If the warning is valid and optimization would improve the code, please provide specific optimization suggestions. If the warning can be safely ignored, please explain why:${issueDetails}`
      : `Please optimize the code based on the following Review Issue:${issueDetails}`

  let formattedText = promptText

  // Add code snippets if they exist
  if (snippets && snippets.length > 0) {
    formattedText += '\n\n'

    for (const snippet of snippets) {
      formattedText += `\`\`\`\n// ${snippet.filename}\n${snippet.snippet}\n\`\`\`\n\n`
    }
  }

  return formattedText
}

/**
 * Formats all review issues into a single text
 */
export function formatAllReviewIssues(
  issues: Array<{
    id: number
    category: string
    severity: string
    description: string
    suggestion: string
    resolvedAt?: string | null
    suggestionSnippets: Array<{
      id: number
      filename: string
      snippet: string
    }>
  }>,
): string {
  // Filter issues to only include critical severity and unresolved issues
  const filteredIssues = issues.filter(
    (issue) => issue.severity === 'CRITICAL' && !issue.resolvedAt,
  )

  if (filteredIssues.length === 0) {
    return 'No critical unresolved review issues found.'
  }

  return filteredIssues
    .map((issue) =>
      formatReviewIssue({
        category: issue.category,
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion,
        snippets: issue.suggestionSnippets.map((snippet) => ({
          filename: snippet.filename,
          snippet: snippet.snippet,
        })),
      }),
    )
    .join('\n\n---\n\n')
}
