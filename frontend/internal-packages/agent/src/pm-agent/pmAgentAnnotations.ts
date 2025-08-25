import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'

/**
 * PM Agent subgraph specific state annotation
 * Includes private state for retry tracking
 */
export const pmAgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  analyzedRequirements: Annotation<{
    businessRequirement: string
    functionalRequirements: Record<string, string[]>
    nonFunctionalRequirements: Record<string, string[]>
  }>,
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
