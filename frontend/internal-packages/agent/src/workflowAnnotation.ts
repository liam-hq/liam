import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Artifact } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/schema'
import type { Testcase } from './qa-agent/types'
import type { AnalyzedRequirements } from './utils/schema/analyzedRequirements'

export const workflowAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userInput: Annotation<string>,
  analyzedRequirements: Annotation<AnalyzedRequirements>({
    reducer: (x, y) => y ?? x,
    default: () => ({
      businessRequirement: '',
      functionalRequirements: {},
      nonFunctionalRequirements: {},
    }),
  }),
  artifact: Annotation<Artifact>({
    reducer: (x, y) => y ?? x,
    default: () => ({
      requirement_analysis: {
        business_requirement: '',
        requirements: [],
      },
    }),
  }),
  testcases: Annotation<Testcase[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  schemaData: Annotation<Schema>,
  buildingSchemaId: Annotation<string>,
  latestVersionNumber: Annotation<number>,
  organizationId: Annotation<string>,
  userId: Annotation<string>,
  designSessionId: Annotation<string>,

  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})
