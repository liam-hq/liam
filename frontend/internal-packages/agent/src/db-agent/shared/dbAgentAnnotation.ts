import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'

export const dbAgentAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
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

  // DB Agent private state for retry tracking
  designSchemaRetryCount: Annotation<number>({
    reducer: (current, update) => update ?? current ?? 0,
    default: () => 0,
  }),

  // Flag to indicate successful schema design tool execution
  schemaDesignSuccessful: Annotation<boolean>({
    reducer: (current, update) => update ?? current ?? false,
    default: () => false,
  }),
})

export type DbAgentState = typeof dbAgentAnnotation.State
