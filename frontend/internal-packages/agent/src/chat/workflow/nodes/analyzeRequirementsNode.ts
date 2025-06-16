import * as v from 'valibot'
import { PMAgent } from '../../../langchain/agents'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

const brdResponseSchema = v.object({
  brd: v.array(v.string()),
})

function handlePMAgentResponse(response: string): { brd: string[] } | null {
  try {
    const parsed: unknown = JSON.parse(response)
    const validationResult = v.safeParse(brdResponseSchema, parsed)

    if (validationResult.success) {
      return {
        brd: validationResult.output.brd,
      }
    }

    console.warn(
      'PM Agent response validation failed:',
      validationResult.issues,
    )
    return null
  } catch (error) {
    console.error('Failed to parse PM Agent response:', error)
    return null
  }
}

export const analyzeRequirementsNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    const pmAgent = new PMAgent()
    const schemaText = convertSchemaToText(state.schemaData)
    const chatHistory = state.history.join('\n')

    const response = await pmAgent.generate({
      schema_text: schemaText,
      chat_history: chatHistory,
      user_message: state.userInput,
    })

    const parsedResponse = handlePMAgentResponse(response)

    if (!parsedResponse) {
      return {
        ...state,
        error: 'Failed to parse BRD from PM Agent response',
      }
    }

    return {
      ...state,
      brd: parsedResponse.brd,
      error: undefined,
    }
  } catch (error) {
    console.error('Error in analyzeRequirementsNode:', error)
    return {
      ...state,
      error: `Failed to analyze requirements: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
