import * as v from 'valibot'

/**
 * Valibot schema for AnalyzedRequirements structure
 * Used across PM Agent, QA Agent, and workflow systems
 */
export const analyzedRequirementsSchema = v.object({
  businessRequirement: v.string(),
  functionalRequirements: v.record(v.string(), v.array(v.string())),
  nonFunctionalRequirements: v.record(v.string(), v.array(v.string())),
})

/**
 * TypeScript type derived from the Valibot schema
 */
export type AnalyzedRequirements = v.InferOutput<
  typeof analyzedRequirementsSchema
>

/**
 * Optional version for LangGraph annotations that can be undefined
 */
export type AnalyzedRequirementsAnnotationType =
  | AnalyzedRequirements
  | undefined
