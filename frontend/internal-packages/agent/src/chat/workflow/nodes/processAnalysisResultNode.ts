import type { RunnableConfig } from '@langchain/core/runnables'
import { err, ok } from 'neverthrow'
import * as v from 'valibot'
import { requirementsAnalysisSchema } from '../../../langchain/agents/pmAnalysisAgent/agent'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'processAnalysisResultNode'

type AnalysisResult = v.InferOutput<typeof requirementsAnalysisSchema>

/**
 * Log analysis results for debugging/monitoring purposes
 * TODO: Remove this function once the feature is stable and monitoring is no longer needed
 */
const logAnalysisResult = (
  logger: { log: (message: string) => void },
  result: AnalysisResult,
): void => {
  logger.log(`[${NODE_NAME}] Analysis Result:`)
  logger.log(`[${NODE_NAME}] BRD: ${result.businessRequirement}`)
  logger.log(
    `[${NODE_NAME}] Functional Requirements: ${JSON.stringify(result.functionalRequirements)}`,
  )
  logger.log(
    `[${NODE_NAME}] Non-Functional Requirements: ${JSON.stringify(result.nonFunctionalRequirements)}`,
  )
}

/**
 * Process Analysis Result Node - Extract tool results from messages
 * Processes the tool execution results and sets analyzedRequirements
 */
export async function processAnalysisResultNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { logger } = configurableResult.value

  logger.log(`[${NODE_NAME}] Started`)

  // Helper function to extract analysis result
  const extractAnalysisResult = () => {
    // Find the most recent AI message with tool calls
    const lastMessage = state.messages[state.messages.length - 1]

    if (!lastMessage || lastMessage._getType() !== 'ai') {
      return err(new Error('No AI message found for processing'))
    }

    // Use direct property access with any for now to avoid complex type issues
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const aiMessage = lastMessage as any

    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      !aiMessage.tool_calls ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      !Array.isArray(aiMessage.tool_calls) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      aiMessage.tool_calls.length === 0
    ) {
      return err(new Error('No tool calls found in the last message'))
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access
    const toolCall = aiMessage.tool_calls[0] as any

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!toolCall || toolCall.name !== 'analyze_requirements') {
      return err(new Error('No analysis tool call found in the last message'))
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!toolCall.args) {
      return err(new Error('Tool call does not have args property'))
    }

    // Use neverthrow to handle potential parsing errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const parseResult = v.safeParse(requirementsAnalysisSchema, toolCall.args)

    if (!parseResult.success) {
      return err(
        new Error(
          `Validation failed: ${parseResult.issues.map((i) => i.message).join(', ')}`,
        ),
      )
    }

    // Log the analysis result for debugging/monitoring purposes
    logAnalysisResult(logger, parseResult.output)

    return ok(parseResult.output)
  }

  const analysisResult = extractAnalysisResult()

  return analysisResult.match(
    async (result) => {
      await logAssistantMessage(state, 'Requirements analysis completed')

      logger.log(`[${NODE_NAME}] Completed`)

      return {
        ...state,
        analyzedRequirements: {
          businessRequirement: result.businessRequirement,
          functionalRequirements: result.functionalRequirements,
          nonFunctionalRequirements: result.nonFunctionalRequirements,
        },
        error: undefined, // Clear error on success
      }
    },
    async (error) => {
      logger.error(`[${NODE_NAME}] Failed: ${error.message}`)

      await logAssistantMessage(
        state,
        'Error occurred during requirements analysis processing',
      )

      return {
        ...state,
        error,
      }
    },
  )
}
