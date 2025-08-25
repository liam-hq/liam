import type { BaseMessage } from '@langchain/core/messages'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { PmAgentState } from '../pmAgentAnnotations'

const MAX_ANALYSIS_RETRY_COUNT = 3

/**
 * Determines the next node after analyzeRequirements based on whether
 * the last message contains tool calls (saveRequirementsToArtifactTool)
 * and handles retry logic for failed requirements analysis
 */
export const routeAfterAnalyzeRequirements = (
  state: PmAgentState,
): 'invokeSaveArtifactTool' | 'END' | 'analyzeRequirements' => {
  const { messages, analyzedRequirements, analyzedRequirementsRetryCount } =
    state

  // 1. If requirements are saved successfully (not empty), END the subgraph
  if (analyzedRequirements.businessRequirement !== '') {
    return 'END'
  }

  // 2. If retry limit exceeded, throw error
  if (analyzedRequirementsRetryCount >= MAX_ANALYSIS_RETRY_COUNT) {
    throw new WorkflowTerminationError(
      new Error(
        `Failed to analyze requirements after ${MAX_ANALYSIS_RETRY_COUNT} attempts`,
      ),
      'routeAfterAnalyzeRequirements',
    )
  }

  // 3. If last message has tool calls, execute them
  const lastMessage = messages[messages.length - 1]
  if (lastMessage && hasToolCalls(lastMessage)) {
    return 'invokeSaveArtifactTool'
  }

  // 4. No tool calls and requirements not set -> re-analyze
  return 'analyzeRequirements'
}

/**
 * Checks if a message contains tool calls
 */
const hasToolCalls = (message: BaseMessage): boolean => {
  return (
    'tool_calls' in message &&
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  )
}
