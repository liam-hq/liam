import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { PreAssessmentAgent } from '../../../langchain/agents/preAssessmentAgent'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

export async function preAssessmentNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'pm'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'preAssessmentNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing your request to determine the best approach...',
    assistantRole,
  )

  const preAssessmentAgent = new PreAssessmentAgent()

  const assessmentResult = await preAssessmentAgent.generate(state.messages)

  return assessmentResult.match(
    async (assessmentData) => {
      if (
        assessmentData.reasoning?.summary &&
        assessmentData.reasoning.summary.length > 0
      ) {
        for (const summaryItem of assessmentData.reasoning.summary) {
          await logAssistantMessage(
            state,
            repositories,
            summaryItem.text,
            assistantRole,
          )
        }
      }

      await logAssistantMessage(
        state,
        repositories,
        assessmentData.response.response,
        assistantRole,
      )

      const preAssessmentResult = {
        decision: assessmentData.response.decision,
        reasoning: assessmentData.response.reasoning,
        response: assessmentData.response.response,
      }

      return {
        ...state,
        preAssessmentResult,
      }
    },
    async (error) => {
      const currentRetryCount = state.retryCount['preAssessment'] || 0
      const newRetryCount = currentRetryCount + 1

      await logAssistantMessage(
        state,
        repositories,
        `Having trouble analyzing your request (attempt ${newRetryCount}): ${error.message}. Let me try a different approach...`,
        assistantRole,
      )

      return {
        ...state,
        retryCount: {
          ...state.retryCount,
          preAssessment: newRetryCount,
        },
        preAssessmentResult: undefined,
      }
    },
  )
}
