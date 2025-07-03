import { QADMLValidationAgent } from '../../../langchain/agents'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'prepareDMLNode'

function formatUsecasesForDML(
  usecases: NonNullable<WorkflowState['generatedUsecases']>,
  schemaText: string,
): string {
  return `
Database Schema:
${schemaText}

Generated Use Cases:
${usecases
  .map(
    (usecase, index) => `
${index + 1}. ${usecase.title} (${usecase.requirementType})
   Category: ${usecase.requirementCategory}
   Requirement: ${usecase.requirement}
   Description: ${usecase.description}
`,
  )
  .join('\n')}

Please generate comprehensive DML statements to test this schema based on the use cases above.
`
}

/**
 * Prepare DML Node - QA Agent generates DML
 * Performed by qaAgent
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

  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    const errorMessage = 'No generated use cases found. Cannot prepare DML.'
    state.logger.error(`[${NODE_NAME}] ${errorMessage}`)
    return {
      ...state,
      error: errorMessage,
    }
  }

  const dmlAgent = new QADMLValidationAgent()

  const schemaText = convertSchemaToText(state.schemaData)
  const usecasesText = formatUsecasesForDML(state.generatedUsecases, schemaText)

  const promptVariables: BasePromptVariables = {
    chat_history: state.formattedHistory,
    user_message: usecasesText,
  }

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const result = await dmlAgent.generate(promptVariables)

    const dmlStatements = result.statements
      .map((stmt) => `-- ${stmt.description}\n${stmt.sql}`)
      .join('\n\n')

    state.logger.log(
      `[${NODE_NAME}] Generated ${result.statements.length} DML statements`,
    )
    state.logger.log(`[${NODE_NAME}] Completed`)

    return {
      ...state,
      dmlStatements,
      error: undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    state.logger.error(`[${NODE_NAME}] Failed: ${errorMessage}`)

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
