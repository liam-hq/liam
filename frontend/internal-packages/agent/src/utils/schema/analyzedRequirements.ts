import * as v from 'valibot'

const requirementItemSchema = v.object({
  id: v.string(),
  desc: v.string(),
})

/**
 * Valibot schema for AnalyzedRequirements structure
 * Used across PM Agent, QA Agent, and workflow systems
 */
export const analyzedRequirementsSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(requirementItemSchema)),
  nonFunctionalRequirements: v.record(
    v.string(),
    v.array(requirementItemSchema),
  ),
})

export type RequirementItem = v.InferOutput<typeof requirementItemSchema>
export type AnalyzedRequirements = v.InferOutput<
  typeof analyzedRequirementsSchema
>
