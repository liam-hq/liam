import { convertSchemaToText } from '../../../vectorstore/convertSchemaToText'
import type { WorkflowState } from '../types'

export const validationNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  if (!state.mode) {
    return {
      ...state,
      error: 'Mode must be selected in UI before processing',
    }
  }

  if (!state.schemaData) {
    return {
      ...state,
      error: 'Schema data is required for answer generation',
    }
  }

  const agentName =
    state.mode === 'Build'
      ? ('databaseSchemaBuildAgent' as const)
      : ('databaseSchemaAskAgent' as const)

  const schemaText = convertSchemaToText(state.schemaData)

  const formattedChatHistory =
    state.history && state.history.length > 0
      ? state.history.join('\n')
      : 'No previous conversation.'

  return {
    ...state,
    agentName,
    schemaText,
    formattedChatHistory,
    error: undefined,
  }
}
