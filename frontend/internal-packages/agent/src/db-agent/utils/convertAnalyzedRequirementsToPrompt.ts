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

    // Filter functional requirements
    const filteredFunctionalRequirements: Record<
      string,
      Array<{ id: string; desc: string }>
    > = {}
    for (const [category, reqs] of Object.entries(
      requirements.functionalRequirements,
    )) {
      const filteredReqs = reqs.filter((req) => issueRequirementIds.has(req.id))
      if (filteredReqs.length > 0) {
        filteredFunctionalRequirements[category] = filteredReqs
      }
    }

    // Filter non-functional requirements
    const filteredNonFunctionalRequirements: Record<
      string,
      Array<{ id: string; desc: string }>
    > = {}
    for (const [category, reqs] of Object.entries(
      requirements.nonFunctionalRequirements,
    )) {
      const filteredReqs = reqs.filter((req) => issueRequirementIds.has(req.id))
      if (filteredReqs.length > 0) {
        filteredNonFunctionalRequirements[category] = filteredReqs
      }
    }

    // Return filtered requirements without schema issues information
    return `Business Requirement: ${requirements.businessRequirement}

Functional Requirements:
${Object.entries(filteredFunctionalRequirements)
  .map(
    ([category, requirements]) =>
      `- ${category}: ${requirements.map((req) => req.desc).join(', ')}`,
  )
  .join('\n')}

Non-Functional Requirements:
${Object.entries(filteredNonFunctionalRequirements)
  .map(
    ([category, requirements]) =>
      `- ${category}: ${requirements.map((req) => req.desc).join(', ')}`,
  )
  .join('\n')}`.trim()
  }

  // Default behavior - process all requirements
  return `Business Requirement: ${requirements.businessRequirement}

Functional Requirements:
${Object.entries(requirements.functionalRequirements)
  .map(
    ([category, requirements]) =>
      `- ${category}: ${requirements.map((req) => req.desc).join(', ')}`,
  )
  .join('\n')}

Non-Functional Requirements:
${Object.entries(requirements.nonFunctionalRequirements)
  .map(
    ([category, requirements]) =>
      `- ${category}: ${requirements.map((req) => req.desc).join(', ')}`,
  )
  .join('\n')}`.trim()
}
