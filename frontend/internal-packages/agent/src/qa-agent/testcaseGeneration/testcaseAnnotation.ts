import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { RequirementData } from '../distributeRequirements'
import type { Testcase } from '../types'

export const schemaIssuesAnnotation = Annotation<string[]>({
  reducer: (prev, next) => prev.concat(next),
  default: () => [],
})

export const testcaseAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  currentRequirement: Annotation<RequirementData>,
  schemaContext: Annotation<string>,
  testcases: Annotation<Testcase[]>({
    reducer: (prev, next) => prev.concat(next),
  }),
  schemaIssues: schemaIssuesAnnotation,
})
