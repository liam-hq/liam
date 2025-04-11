/**
 * Formats a review feedback into a standardized prompt format
 */
export function formatReviewFeedback({
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
  const feedbackDetails = `
- Category: ${category}
- Severity: ${severity}
- Issue: ${description}
- Suggestion: ${suggestion}`

  const promptText =
    severity === 'WARNING'
      ? `Please review the following warning and determine if optimization is necessary. If the warning is valid and optimization would improve the code, please provide specific optimization suggestions. If the warning can be safely ignored, please explain why:${feedbackDetails}`
      : `Please optimize the code based on the following Review Feedback:${feedbackDetails}`

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
 * Formats all review feedbacks into a single text
 */
export function formatAllReviewFeedbacks(
  feedbacks: Array<{
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
  // Filter feedbacks to only include critical severity and unresolved feedbacks
  const filteredFeedbacks = feedbacks.filter(
    (feedback) => feedback.severity === 'CRITICAL' && !feedback.resolvedAt,
  )

  if (filteredFeedbacks.length === 0) {
    return 'No critical unresolved review feedbacks found.'
  }

  return filteredFeedbacks
    .map((feedback) =>
      formatReviewFeedback({
        category: feedback.category,
        severity: feedback.severity,
        description: feedback.description,
        suggestion: feedback.suggestion,
        snippets: feedback.suggestionSnippets.map((snippet) => ({
          filename: snippet.filename,
          snippet: snippet.snippet,
        })),
      }),
    )
    .join('\n\n---\n\n')
}
