import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'

export const dbAgentAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  schemaData: Annotation<Schema>,
  organizationId: Annotation<string>,
  userId: Annotation<string>,
  designSessionId: Annotation<string>,
  prompt: Annotation<string>,
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),

  // Flag to indicate successful create migration tool execution
  createMigrationSuccessful: Annotation<boolean>({
    reducer: (current, update) => update ?? current ?? false,
    default: () => false,
  }),
})

export type DbAgentState = typeof dbAgentAnnotation.State
