import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { SchemaIssue } from '../../workflowSchemaIssuesAnnotation'
import type { TestCaseData } from '../distributeRequirements'

/**
 * Schema issues annotation for QA agent's parallel processing.
 *
 * Uses concat reducer because:
 * - Multiple testcase nodes run in parallel
 * - Each node may discover different schema issues
 * - All issues must be collected together
 *
 * This is different from workflow-level annotation which uses replacement
 * for clearing issues after DB agent processing.
 */
export const qaSchemaIssuesAnnotation = Annotation<Array<SchemaIssue>>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
})

type GeneratedSql = {
  testcaseId: string
  sql: string
}

export const generatedSqlsAnnotation = Annotation<Array<GeneratedSql>>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
})

type SkipReason = {
  testcaseId: string
  reason: string
}

export const skipReasonsAnnotation = Annotation<Array<SkipReason>>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
})

export const testcaseAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  currentTestcase: Annotation<TestCaseData>,
  schemaData: Annotation<Schema>,
  goal: Annotation<string>,
  schemaIssues: qaSchemaIssuesAnnotation,
  generatedSqls: generatedSqlsAnnotation,
  skipReasons: skipReasonsAnnotation,
})
