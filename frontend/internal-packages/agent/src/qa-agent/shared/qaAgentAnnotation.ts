import { Annotation, END, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { AnalyzedRequirementsAnnotationType } from '../../utils/schema/analyzedRequirements'
import type { Testcase } from '../types'

/**
 * QA Agent subgraph specific state annotation
 * Contains only the fields actually used by QA Agent nodes
 */
export const qaAgentAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  schemaData: Annotation<Schema>,
  analyzedRequirements: Annotation<AnalyzedRequirementsAnnotationType>,
  testcases: Annotation<Testcase[]>,
  designSessionId: Annotation<string>,
  buildingSchemaId: Annotation<string>,
  latestVersionNumber: Annotation<number>,
  dmlExecutionErrors: Annotation<string | undefined>,
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
})

export type QaAgentState = typeof qaAgentAnnotation.State
