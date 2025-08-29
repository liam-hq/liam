import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { RequirementData } from '../distributeRequirements'
import type { Testcase } from '../types'

export const testcaseAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  currentRequirement: Annotation<RequirementData>,
  schemaData: Annotation<Schema>,
  testcases: Annotation<Testcase[]>({
    reducer: (prev, next) => prev.concat(next),
  }),
})
