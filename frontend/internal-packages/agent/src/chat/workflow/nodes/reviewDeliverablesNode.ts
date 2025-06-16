import { PMAgentReview } from '../../../langchain/agents'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

export const reviewDeliverablesNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    if (!state.brd || state.brd.length === 0) {
      return {
        ...state,
        error: 'No BRD available for deliverable review',
      }
    }

    if (!state.validationResults || state.validationResults.length === 0) {
      return {
        ...state,
        error: 'No validation results available for review',
      }
    }

    const pmAgentReview = new PMAgentReview()
    const schemaText = convertSchemaToText(state.schemaData)
    const chatHistory = state.history.join('\n')
    const brdRequirements = state.brd.join('\n')

    const validationResultsSummary = state.validationResults
      .map((result, index) => {
        const status = result.success ? 'SUCCESS' : 'FAILURE'
        const error = result.errorMessage
          ? ` - Error: ${result.errorMessage}`
          : ''
        return `Query ${index + 1}: ${status}${error}\nQuery: ${result.query}\n`
      })
      .join('\n')

    const response = await pmAgentReview.generate({
      schema_text: schemaText,
      chat_history: chatHistory,
      user_message: state.userInput,
      brd_requirements: brdRequirements,
      validation_results: validationResultsSummary,
    })

    const successfulQueries = state.validationResults.filter(
      (r) => r.success,
    ).length
    const totalQueries = state.validationResults.length
    const successRate = totalQueries > 0 ? successfulQueries / totalQueries : 0

    const isDeliverableAcceptable = successRate >= 0.8

    if (!isDeliverableAcceptable) {
      return {
        ...state,
        error: `Deliverable review failed: Only ${successfulQueries}/${totalQueries} validation queries passed. Schema needs improvement.`,
        generatedAnswer: response,
      }
    }

    return {
      ...state,
      generatedAnswer: response,
      error: undefined,
    }
  } catch (error) {
    console.error('Error in reviewDeliverablesNode:', error)
    return {
      ...state,
      error: `Failed to review deliverables: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
