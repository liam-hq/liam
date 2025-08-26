import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { Testcase } from '../../../qa-agent/generateTestcase/agent'

export const workflowAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userInput: Annotation<string>,
  analyzedRequirements: Annotation<
    | {
        businessRequirement: string
        functionalRequirements: Record<string, string[]>
        nonFunctionalRequirements: Record<string, string[]>
      }
    | undefined
  >,
  generatedTestcases: Annotation<Testcase[] | undefined>,
  schemaData: Annotation<Schema>,
  buildingSchemaId: Annotation<string>,
  latestVersionNumber: Annotation<number>,
  organizationId: Annotation<string>,
  userId: Annotation<string>,
  designSessionId: Annotation<string>,

  dmlStatements: Annotation<string | undefined>,

  // DML execution results
  dmlExecutionErrors: Annotation<string | undefined>,

  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})
