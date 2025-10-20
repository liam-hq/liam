import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'

type TestCases = AnalyzedRequirements['testcases']

export const convertRequirementsToPrompt = (
  requirements: AnalyzedRequirements,
  userInput: string,
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

  const testCasesSection = Object.entries(testcasesToUse)
    .map(
      ([category, testcases]) =>
        `- ${category}: ${testcases.map((tc) => `${tc.title} (${tc.type})`).join(', ')}`,
    )
    .join('\n')

  const schemaIssuesSection =
    schemaIssues && schemaIssues.length > 0
      ? `\n\n## Schema Issues to Fix\n\n${schemaIssues.map((issue, index) => `${index + 1}. ${issue.description}`).join('\n')}`
      : ''

  return `## Session Goal

${requirements.goal}

## Original User Request

${userInput}

## Requirements

${testCasesSection}${schemaIssuesSection}`.trim()
}
