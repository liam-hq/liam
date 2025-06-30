import { QADMLGenerationAgent } from '../../../langchain/agents'
import type { DMLGenerationVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'prepareDMLNode'

/**
 * Format usecases into a structured text for AI processing
 */
function formatUsecasesForDML(
  usecases: NonNullable<WorkflowState['generatedUsecases']>,
): string {
  return `
Generate realistic test data for the following use cases:

${usecases
  .map(
    (usecase, index) => `
${index + 1}. ${usecase.title}
   Category: ${usecase.requirementCategory}
   Type: ${usecase.requirementType}
   Requirement: ${usecase.requirement}
   Description: ${usecase.description}`,
  )
  .join('\n')}

Please create comprehensive DML statements (INSERT, UPDATE, DELETE) that would test these scenarios effectively.
`
}

/**
 * Prepare DML Node - QA Agent generates DML statements for testing
 * Performed by QADMLGenerationAgent
 */
export async function prepareDMLNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  if (state.onNodeProgress) {
    await state.onNodeProgress(
      'prepareDML',
      getWorkflowNodeProgress('prepareDML'),
    )
  }

  // Check if we have generated usecases
  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    const errorMessage =
      'No generated usecases found. Cannot prepare DML statements.'
    state.logger.error(`[${NODE_NAME}] ${errorMessage}`)
    return {
      ...state,
      error: errorMessage,
    }
  }

  const qaAgent = new QADMLGenerationAgent()

  // Convert schema to text for the agent
  const schemaText = convertSchemaToText(state.schemaData)

  // Create a user message that includes the formatted usecases
  const usecasesText = formatUsecasesForDML(state.generatedUsecases)

  const promptVariables: DMLGenerationVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: usecasesText,
    usecases: state.generatedUsecases,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const dmlStatements = await qaAgent.generate(promptVariables)

    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      dmlStatements,
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
