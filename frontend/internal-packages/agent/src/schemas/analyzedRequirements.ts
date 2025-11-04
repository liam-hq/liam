import * as v from 'valibot'

// Test result schema
const testResultSchema = v.object({
  executedAt: v.pipe(v.string(), v.isoTimestamp()),
  success: v.boolean(),
  message: v.string(),
  skipReason: v.optional(v.string()),
})

// Test case schema
export const testCaseSchema = v.object({
  id: v.string(),
  title: v.string(),
  type: v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
  sql: v.string(),
  testResults: v.array(testResultSchema),
  skipReason: v.optional(v.string()),
})

export type TestCase = v.InferOutput<typeof testCaseSchema>

/**
 * Valibot schema for AnalyzedRequirements structure
 * Used across PM Agent, QA Agent, and workflow systems
 */
export const analyzedRequirementsSchema = v.object({
  goal: v.string(),
  testcases: v.record(v.string(), v.array(testCaseSchema)),
})

export type AnalyzedRequirements = v.InferOutput<
  typeof analyzedRequirementsSchema
>
