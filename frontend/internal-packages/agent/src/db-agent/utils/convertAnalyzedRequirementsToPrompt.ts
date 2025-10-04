import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'

type TestCases = AnalyzedRequirements['testcases']

export const convertRequirementsToPrompt = (
  requirements: AnalyzedRequirements,
  schemaIssues?: Array<{ testcaseId: string; description: string }>,
): string => {
  let testcasesToUse: TestCases = requirements.testcases

  // If schemaIssues provided, filter testcases to only those with issues
  if (schemaIssues && schemaIssues.length > 0) {
    const issueTestcaseIds = new Set(
      schemaIssues.map((issue) => issue.testcaseId),
    )

    const filteredTestcases: TestCases = {}
    for (const [category, testcases] of Object.entries(
      requirements.testcases,
    )) {
      const filteredCases = testcases.filter((tc) =>
        issueTestcaseIds.has(tc.id),
      )
      if (filteredCases.length > 0) {
        filteredTestcases[category] = filteredCases
      }
    }

    testcasesToUse = filteredTestcases
  }

  return `Session Goal:${requirements.goal ? ` ${requirements.goal}` : ''}

Test Cases:
${Object.entries(testcasesToUse)
  .map(
    ([category, testcases]) =>
      `- ${category}: ${testcases.map((tc) => `${tc.title} (${tc.type})`).join(', ')}`,
  )
  .join('\n')}`.trim()
}
