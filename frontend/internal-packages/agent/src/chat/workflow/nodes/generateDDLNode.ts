import { QADDLGenerationAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

const NODE_NAME = 'generateDDL'

interface PreparedDDLGeneration {
  agent: QADDLGenerationAgent
  schemaText: string
}

/**
 * Prepare QA DDL generation
 */
async function prepareDDLGeneration(
  state: WorkflowState,
): Promise<PreparedDDLGeneration> {
  const schemaText = convertSchemaToText(state.schemaData)
  const agent = new QADDLGenerationAgent()

  return {
    agent,
    schemaText,
  }
}

/**
 * Generate DDL Node - QA Agent generates DDL
 * Performed by qaAgent
 *
 * TODO: DDL generation using LLM is a temporary solution.
 * In the future, DDL will be generated mechanically without LLM.
 */
export async function generateDDLNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const { agent, schemaText } = await prepareDDLGeneration(state)

    const promptVariables: BasePromptVariables = {
      schema_text: schemaText,
      chat_history: state.formattedHistory,
      user_message:
        'Generate DDL statements from the existing schema for validation and testing',
    }

    const ddlStatements = await agent.generate(promptVariables)

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      ddlStatements,
      error: undefined, // Clear error on success
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    state.logger.error(`[${NODE_NAME}] Failed: ${errorMessage}`)

    // Increment retry count and set error
    return {
      ...state,
      error: errorMessage,
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }
}
