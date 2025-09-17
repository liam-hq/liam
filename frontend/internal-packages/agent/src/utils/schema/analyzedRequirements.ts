import * as v from 'valibot'

const requirementItemSchema = v.object({
  id: v.string(),
  desc: v.string(),
})

/**
 * Valibot schema for AnalyzedRequirements structure
 * Used across PM Agent, QA Agent, and workflow systems
 */
const requirementsSchema = v.record(v.string(), v.array(requirementItemSchema))
export type Requirements = v.InferOutput<typeof requirementsSchema>

export const analyzedRequirementsSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: requirementsSchema,
  nonFunctionalRequirements: requirementsSchema,
})

export type RequirementItem = v.InferOutput<typeof requirementItemSchema>
export type AnalyzedRequirements = v.InferOutput<
  typeof analyzedRequirementsSchema
>
