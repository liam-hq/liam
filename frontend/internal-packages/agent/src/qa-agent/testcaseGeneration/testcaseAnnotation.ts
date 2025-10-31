import type { BaseMessage } from '@langchain/core/messages'
import { Annotation } from '@langchain/langgraph'
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

export const testcaseAnnotation = Annotation.Root({
  internalMessages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentTestcase: Annotation<TestCaseData>,
  schemaData: Annotation<Schema>,
  goal: Annotation<string>,
  schemaIssues: qaSchemaIssuesAnnotation,
  generatedSqls: generatedSqlsAnnotation,
})
