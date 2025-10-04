import * as v from 'valibot'

const testResultSchema = v.object({
  executedAt: v.pipe(v.string(), v.isoDateTime()),
  success: v.boolean(),
  message: v.string(),
})

export const testCaseSchema = v.object({
  id: v.string(),
  title: v.string(),
  type: v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
  sql: v.string(),
  testResults: v.array(testResultSchema),
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
