import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { AnalyzedRequirements } from './schemas/analyzedRequirements'
import { workflowSchemaIssuesAnnotation } from './workflowSchemaIssuesAnnotation'

export const workflowAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  analyzedRequirements: Annotation<AnalyzedRequirements>({
    reducer: (x, y) => y ?? x,
    default: () => ({
      goal: '',
      testcases: {},
    }),
  }),
  schemaData: Annotation<Schema>,
  organizationId: Annotation<string>,
  userId: Annotation<string>,
  designSessionId: Annotation<string>,
  schemaIssues: workflowSchemaIssuesAnnotation,

  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})
