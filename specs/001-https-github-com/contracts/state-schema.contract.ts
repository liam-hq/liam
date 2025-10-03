/**
 * Agent State Schema Contract
 *
 * Defines the complete agent state structure including requirements field.
 * This contract ensures type-safe state transitions across all agents.
 */

import { Annotation } from '@langchain/langgraph';
import * as v from 'valibot';
import type { Requirements, Testcase } from './pm-agent-output.contract';
import { testResultSchema } from './pm-agent-output.contract';

/**
 * Requirements State Field
 * Annotation definition for the requirements field in agent state
 */
export const RequirementsStateAnnotation = Annotation<Requirements>({
  reducer: (_, update) => update, // Replace strategy - full update each time
  default: () => ({ goal: '', testcases: [] }),
});

/**
 * Legacy AnalyzedRequirements (Phase 1-2 only)
 * Will be removed in Phase 3
 */
export const LegacyAnalyzedRequirementsAnnotation = Annotation<{
  businessRequirement: string;
  functionalRequirements: unknown[];
}>({
  reducer: (_, update) => update,
});

/**
 * Runtime validation for state updates
 *
 * Note: State schema requires sql as mandatory field.
 * PM agent tool schema omits sql field to prevent LLM from generating it.
 * QA agent tool schema includes sql field.
 */
export const stateUpdateSchema = v.object({
  requirements: v.optional(
    v.object({
      goal: v.string(),
      testcases: v.array(
        v.object({
          title: v.string(),
          type: v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
          sql: v.string(), // Required in state
          testResults: v.optional(testResultSchema),
        })
      ),
    })
  ),
});

export type StateUpdate = v.InferOutput<typeof stateUpdateSchema>;

/**
 * Validate state update before applying
 */
export function validateStateUpdate(update: unknown): StateUpdate {
  return v.parse(stateUpdateSchema, update);
}

/**
 * Helper to create requirements state update
 */
export function createRequirementsUpdate(goal: string, testcases: Testcase[]) {
  return {
    requirements: {
      goal,
      testcases,
    },
  };
}

/**
 * Helper to update testcases in requirements
 */
export function updateTestcases(currentRequirements: Requirements, newTestcases: Testcase[]) {
  return {
    requirements: {
      ...currentRequirements,
      testcases: newTestcases,
    },
  };
}
