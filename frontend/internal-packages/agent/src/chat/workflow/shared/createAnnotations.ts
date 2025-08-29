import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { Testcase } from '../../../qa-agent/types'

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
  testcases: Annotation<Testcase[] | undefined>({
    reducer: (existing, newTestcases) => {
      // Concatenate test cases from parallel executions
      if (!existing) return newTestcases
      if (!newTestcases) return existing
      return existing.concat(newTestcases)
    },
    default: () => undefined,
  }),
  schemaData: Annotation<Schema>({
    // Use last-write-wins reducer since schemaData is read-only
    // and all parallel executions receive the same value
    reducer: (existing, newValue) => newValue ?? existing,
  }),
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
