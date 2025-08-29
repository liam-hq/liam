import { Annotation, MessagesAnnotation } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/schema'
import type { RequirementData } from '../distributeRequirements'
import type { Testcase } from '../types'

/**
 * Annotation for testcase generation subgraph
 * Each parallel execution has its own isolated state
 */
export const testcaseAnnotation = Annotation.Root({
  // Include messages for LLM conversation tracking
  ...MessagesAnnotation.spec,

  // Current requirement being processed
  currentRequirement: Annotation<RequirementData>,

  // Schema data for context
  schemaData: Annotation<Schema>,

  // Generated testcases (output)
  generatedTestcases: Annotation<Testcase[]>({
    reducer: (existing, newTestcases) => {
      // Concatenate testcases from tool executions
      if (!existing) return newTestcases
      if (!newTestcases) return existing
      return existing.concat(newTestcases)
    },
    default: () => [],
  }),
})
