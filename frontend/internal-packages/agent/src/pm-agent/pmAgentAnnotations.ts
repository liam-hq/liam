import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Artifact } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/schema'
import type { AnalyzedRequirements } from '../utils/schema/analyzedRequirements'

/**
 * PM Agent subgraph specific state annotation
 * Includes private state for retry tracking
 */
export const pmAgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
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
  designSessionId: Annotation<string>,
  schemaData: Annotation<Schema>,

  // PM Agent private state
  analyzedRequirementsRetryCount: Annotation<number>,
})

/**
 * Type definition for PM Agent state
 * Derived from the annotation to ensure type consistency
 */
export type PmAgentState = typeof pmAgentStateAnnotation.State
