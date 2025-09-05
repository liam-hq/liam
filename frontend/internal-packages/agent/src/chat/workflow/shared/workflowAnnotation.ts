import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { Testcase } from '../../../qa-agent/types'
import type { AnalyzedRequirementsAnnotationType } from '../../../utils/schema/analyzedRequirements'

export const workflowAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userInput: Annotation<string>,
  analyzedRequirements: Annotation<AnalyzedRequirementsAnnotationType>,
  testcases: Annotation<Testcase[]>,
  schemaData: Annotation<Schema>,
  buildingSchemaId: Annotation<string>,
  latestVersionNumber: Annotation<number>,
  organizationId: Annotation<string>,
  userId: Annotation<string>,
  designSessionId: Annotation<string>,

  // DML execution results
  dmlExecutionErrors: Annotation<string | undefined>,

  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})
