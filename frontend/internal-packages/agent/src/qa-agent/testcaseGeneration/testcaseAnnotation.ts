import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { RequirementData } from '../distributeRequirements'
import type { Testcase } from '../types'

type SchemaIssue = {
  requirementId: string
  description: string
}

export const schemaIssuesAnnotation = Annotation<Array<SchemaIssue>>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
})

export const testcaseAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  currentRequirement: Annotation<RequirementData>,
  schemaData: Annotation<Schema>,
  testcases: Annotation<Testcase[]>({
    reducer: (prev, next) => prev.concat(next),
  }),
  schemaIssues: schemaIssuesAnnotation,
})
