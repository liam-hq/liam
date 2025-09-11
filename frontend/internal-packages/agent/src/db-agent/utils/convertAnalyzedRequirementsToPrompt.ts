import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'

export const convertRequirementsToPrompt = (
  requirements: AnalyzedRequirements,
): string => {
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
