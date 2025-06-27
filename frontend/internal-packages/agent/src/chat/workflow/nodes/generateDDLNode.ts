import { QADDLGenerationAgent } from '../../../langchain/agents'
import type { SchemaAwareChatVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'generateDDLNode'

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
  try {
    state.logger.log(`[${NODE_NAME}] Started`)

    if (state.onNodeProgress) {
      await state.onNodeProgress(
        'generateDDL',
        getWorkflowNodeProgress('generateDDL'),
      )
    }

    const { agent, schemaText } = await prepareDDLGeneration(state)

    const promptVariables: SchemaAwareChatVariables = {
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
    }
  } catch (error) {
    state.logger.log(`[${NODE_NAME}] Failed: ${error}`)

    return {
      ...state,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
    }
  }
}
