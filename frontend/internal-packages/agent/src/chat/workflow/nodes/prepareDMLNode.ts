import { QADMLGenerationAgent } from '../../../langchain/agents'
import type { DMLGenerationVariables } from '../../../langchain/agents/qaDMLGenerationAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

const NODE_NAME = 'prepareDMLNode'

interface PreparedDMLGeneration {
  agent: QADMLGenerationAgent
  schemaText: string
  useCasesText: string
}

/**
 * Format use cases into text for AI processing
 */
function formatUseCases(usecases: WorkflowState['generatedUsecases']): string {
  if (!usecases || usecases.length === 0) {
    return 'No specific use cases provided.'
  }

  return usecases
    .map((usecase, index) => {
      return `Use Case ${index + 1}:
Title: ${usecase.title}
Description: ${usecase.description}
Requirement Type: ${usecase.requirementType}
Category: ${usecase.requirementCategory}
Requirement: ${usecase.requirement}`
    })
    .join('\n\n')
}

/**
 * Prepare DML generation
 */
async function prepareDMLGeneration(
  state: WorkflowState,
): Promise<PreparedDMLGeneration> {
  const schemaText = convertSchemaToText(state.schemaData)
  const useCasesText = formatUseCases(state.generatedUsecases)
  const agent = new QADMLGenerationAgent()

  return {
    agent,
    schemaText,
    useCasesText,
  }
}

/**
 * Prepare DML Node - QA Agent generates DML
 * Performed by qaAgent
 */
export async function prepareDMLNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    state.logger.log(`[${NODE_NAME}] Started`)

    const { agent, schemaText, useCasesText } =
      await prepareDMLGeneration(state)

    const promptVariables: DMLGenerationVariables = {
      schema_text: schemaText,
      use_cases: useCasesText,
      chat_history: state.formattedHistory,
      user_message:
        'Generate INSERT statements for testing the schema with realistic data based on the use cases',
    }

    const dmlStatements = await agent.generate(promptVariables)

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      dmlStatements,
    }
  } catch (error) {
    state.logger.log(`[${NODE_NAME}] Failed: ${error}`)

    return {
      ...state,
      dmlStatements: 'DML generation failed due to an unexpected error.',
    }
  }
}
