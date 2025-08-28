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
})

export type DbAgentState = typeof dbAgentAnnotation.State
