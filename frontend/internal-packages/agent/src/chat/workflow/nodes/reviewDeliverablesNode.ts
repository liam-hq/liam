import * as v from 'valibot'
import { PMAgentReview } from '../../../langchain/agents'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

const reviewResponseSchema = v.object({
  evaluation: v.string(),
  satisfied: v.boolean(),
  issues: v.optional(v.array(v.string())),
})

function handlePMAgentReviewResponse(response: string): {
  evaluation: string
  satisfied: boolean
  issues?: string[]
} | null {
  try {
    const parsed: unknown = JSON.parse(response)
    const validationResult = v.safeParse(reviewResponseSchema, parsed)

    if (validationResult.success) {
      return {
        evaluation: validationResult.output.evaluation,
        satisfied: validationResult.output.satisfied,
        ...(validationResult.output.issues && {
          issues: validationResult.output.issues,
        }),
      }
    }

    console.warn(
      'PM Agent Review response validation failed:',
      validationResult.issues,
    )
    return null
  } catch (error) {
    console.error('Failed to parse PM Agent Review response:', error)
    return null
  }
}

/**
 * Review Deliverables Node - Final Requirements & Deliverables Confirmation
 * Performed by pmAgentReview
 */
export async function reviewDeliverablesNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    if (!state.brd || state.brd.length === 0) {
      return { ...state, error: 'No BRD available for deliverable review' }
    }

    if (!state.validationResults || state.validationResults.length === 0) {
      return { ...state, error: 'No validation results available for review' }
    }

    const pmAgentReview = new PMAgentReview()
    const schemaText = convertSchemaToText(state.schemaData)
    const chatHistory = state.history.join('\n')
    const brdRequirements = state.brd.join('\n')
    const validationSummary = state.validationResults
      .map(
        (result, index) =>
          `Query ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'}${
            result.errorMessage ? ` - ${result.errorMessage}` : ''
          }`,
      )
      .join('\n')

    const response = await pmAgentReview.generate({
      schema_text: schemaText,
      chat_history: chatHistory,
      user_message: state.userInput,
      brd_requirements: brdRequirements,
      validation_results: validationSummary,
    })

    const parsedResponse = handlePMAgentReviewResponse(response)

    if (!parsedResponse) {
      return {
        ...state,
        error: 'Failed to parse review from PM Agent Review response',
      }
    }

    return {
      ...state,
      generatedAnswer: parsedResponse.evaluation,
      error: parsedResponse.satisfied
        ? undefined
        : 'Requirements not fully satisfied',
    }
  } catch (error) {
    console.error('Error in reviewDeliverablesNode:', error)
    return {
      ...state,
      error: `Failed to review deliverables: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
