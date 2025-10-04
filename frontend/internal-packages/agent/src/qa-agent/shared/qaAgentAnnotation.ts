import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { AnalyzedRequirements } from '../../utils/schema/analyzedRequirements'
import { schemaIssuesAnnotation } from '../testcaseGeneration/testcaseAnnotation'

/**
 * QA Agent subgraph specific state annotation
 * Contains only the fields actually used by QA Agent nodes
 */
export const qaAgentAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  schemaData: Annotation<Schema>({
    // Read-only field: QA agent should not modify schema data, only read it
    // Using identity reducer to maintain existing value and avoid InvalidUpdateError
    // when multiple subgraphs pass the same schemaData back to parent state
    reducer: (x) => x,
  }),
  analyzedRequirements: Annotation<AnalyzedRequirements>({
    reducer: (x, y) => y ?? x,
    default: () => ({
      goal: '',
      testcases: {},
    }),
  }),
  designSessionId: Annotation<string>,
  buildingSchemaId: Annotation<string>,
  schemaIssues: schemaIssuesAnnotation,
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})

export type QaAgentState = typeof qaAgentAnnotation.State
