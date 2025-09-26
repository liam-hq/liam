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
  sql: v.pipe(v.string(), v.regex(/.*;$/)),
  description: v.string(),
  dml_execution_logs: v.array(dmlExecutionLogSchema),
})

// Test case schema
export const testCaseSchema = v.object({
  title: v.string(),
  description: v.string(),
  dmlOperation: dmlOperationSchema,
})

// Functional requirement schema
export const requirementSchema = v.object({
  name: v.string(),
  description: v.array(v.string()),
  test_cases: v.array(testCaseSchema),
})

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
export type TestCase = v.InferOutput<typeof testCaseSchema>
export type Requirement = v.InferOutput<typeof requirementSchema>
export type RequirementAnalysis = v.InferOutput<
  typeof requirementAnalysisSchema
>
export type Artifact = v.InferOutput<typeof artifactSchema>
