import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'

export const convertRequirementsToPrompt = (
  requirements: AnalyzedRequirements,
  schemaIssues?: Array<{ requirementId: string; description: string }>,
): string => {
  // If schemaIssues provided, filter requirements to only those with issues
  if (schemaIssues && schemaIssues.length > 0) {
    const issueRequirementIds = new Set(
      schemaIssues.map((issue) => issue.requirementId),
    )

    // Filter test cases by matching title against requirementId
    const filteredTestcases: Record<
      string,
      Array<{ title: string; type: string }>
    > = {}
    for (const [category, cases] of Object.entries(requirements.testcases)) {
      const filteredCases = cases.filter((tc) =>
        issueRequirementIds.has(tc.title),
      )
      if (filteredCases.length > 0) {
        filteredTestcases[category] = filteredCases
      }
    }

    // Return filtered requirements without schema issues information
    return `Goal: ${requirements.goal}

Test Cases:
${Object.entries(filteredTestcases)
  .map(
    ([category, testcases]) =>
      `- ${category}: ${testcases.map((tc) => `${tc.title} (${tc.type})`).join(', ')}`,
  )
  .join('\n')}`.trim()
  }

  // Default behavior - process all requirements
  return `Goal: ${requirements.goal}

Test Cases:
${Object.entries(requirements.testcases)
  .map(
    ([category, testcases]) =>
      `- ${category}: ${testcases.map((tc) => `${tc.title} (${tc.type})`).join(', ')}`,
  )
  .join('\n')}`.trim()
}
