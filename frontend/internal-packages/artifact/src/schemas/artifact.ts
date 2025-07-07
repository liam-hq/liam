import * as v from 'valibot'

// DML execution log schema
export const dmlExecutionLogSchema = v.object({
  executed_at: v.pipe(v.string(), v.isoDateTime()),
  success: v.boolean(),
  result_summary: v.string(),
})

// DML operation schema
export const dmlOperationSchema = v.object({
  operation_type: v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
  sql: v.string(),
  dml_execution_logs: v.array(dmlExecutionLogSchema),
})

// Use case schema
export const useCaseSchema = v.object({
  title: v.string(),
  description: v.string(),
  dml_operations: v.array(dmlOperationSchema),
})

// Base requirement schema properties
const baseRequirementProperties = {
  name: v.string(),
  description: v.string(),
}

// Functional requirement schema
export const functionalRequirementSchema = v.object({
  ...baseRequirementProperties,
  type: v.literal('functional'),
  use_cases: v.array(useCaseSchema),
})

// Non-functional requirement schema
export const nonFunctionalRequirementSchema = v.object({
  ...baseRequirementProperties,
  type: v.literal('non_functional'),
})

// Union of requirement types
export const requirementSchema = v.union([
  functionalRequirementSchema,
  nonFunctionalRequirementSchema,
])

// Requirement analysis schema
export const requirementAnalysisSchema = v.object({
  business_requirement: v.string(),
  requirements: v.array(requirementSchema),
})

// Main artifact schema
export const artifactSchema = v.object({
  requirement_analysis: requirementAnalysisSchema,
})

// Export TypeScript types
export type DmlExecutionLog = v.InferOutput<typeof dmlExecutionLogSchema>
export type DmlOperation = v.InferOutput<typeof dmlOperationSchema>
export type UseCase = v.InferOutput<typeof useCaseSchema>
export type FunctionalRequirement = v.InferOutput<
  typeof functionalRequirementSchema
>
export type NonFunctionalRequirement = v.InferOutput<
  typeof nonFunctionalRequirementSchema
>
export type Requirement = v.InferOutput<typeof requirementSchema>
export type RequirementAnalysis = v.InferOutput<
  typeof requirementAnalysisSchema
>
export type Artifact = v.InferOutput<typeof artifactSchema>
