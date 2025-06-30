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

/**
 * Usage Examples:
 *
 * // Validate artifact data
 * import { artifactSchema, type Artifact } from '@liam-hq/db-structure'
 * import * as v from 'valibot'
 *
 * const artifactData = {
 *   requirement_analysis: {
 *     business_requirement: "Build a user management system",
 *     requirements: [
 *       {
 *         type: "functional",
 *         name: "User Registration",
 *         description: "Allow new users to register an account",
 *         use_cases: [
 *           {
 *             title: "New User Registration",
 *             description: "Create a new user account in the system",
 *             dml_operations: [
 *               {
 *                 operation_type: "INSERT",
 *                 sql: "INSERT INTO users (name, email) VALUES ($1, $2)",
 *                 dml_execution_logs: [
 *                   {
 *                     executed_at: "2025-06-25T12:00:00Z",
 *                     success: true,
 *                     result_summary: "User inserted successfully"
 *                   }
 *                 ]
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * // Runtime validation
 * const result = v.safeParse(artifactSchema, artifactData)
 * if (result.success) {
 *   const validatedArtifact: Artifact = result.output
 *   console.log('Valid artifact:', validatedArtifact)
 * } else {
 *   console.error('Validation errors:', result.issues)
 * }
 *
 * // Type-safe usage
 * const createArtifact = (data: Artifact) => {
 *   // data is fully typed and validated
 *   return data
 * }
 */
