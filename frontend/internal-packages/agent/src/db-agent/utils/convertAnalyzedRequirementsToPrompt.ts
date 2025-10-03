import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'

type TestCaseEntry = { title: string; type: string }

const buildPositionMap = (
  testcases: AnalyzedRequirements['testcases'],
): Map<number, { category: string; testcase: TestCaseEntry }> => {
  let position = 1
  const positionMap = new Map<
    number,
    { category: string; testcase: TestCaseEntry }
  >()
  for (const [category, cases] of Object.entries(testcases)) {
    for (const tc of cases) {
      positionMap.set(position, {
        category,
        testcase: { title: tc.title, type: tc.type },
      })
      position++
    }
  }
  return positionMap
}

export const convertRequirementsToPrompt = (
  requirements: AnalyzedRequirements,
  schemaIssues?: Array<{ requirementId: string; description: string }>,
): string => {
  if (schemaIssues && schemaIssues.length > 0) {
    const issueRequirementIds = new Set(
      schemaIssues.map((issue) => issue.requirementId),
    )

    const positionMap = buildPositionMap(requirements.testcases)

    const filteredTestcases: Record<string, TestCaseEntry[]> = {}
    for (const reqId of issueRequirementIds) {
      const pos = Number.parseInt(reqId, 10)
      const entry = positionMap.get(pos)
      if (entry) {
        if (!filteredTestcases[entry.category]) {
          filteredTestcases[entry.category] = []
        }
        filteredTestcases[entry.category]!.push(entry.testcase)
      }
    }

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
