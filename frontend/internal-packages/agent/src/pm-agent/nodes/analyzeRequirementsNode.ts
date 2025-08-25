import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { logAssistantMessage } from '../../chat/workflow/utils/timelineLogger'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { invokePmAnalysisAgent } from '../invokePmAnalysisAgent'
import type { PmAgentState } from '../pmAgentAnnotations'

/**
 * Create a WorkflowState with dummy values for logAssistantMessage compatibility
 */
const createWorkflowStateForLogging = (
  pmState: PmAgentState,
): WorkflowState => ({
  messages: pmState.messages,
  userInput: '',
  analyzedRequirements: pmState.analyzedRequirements,
  designSessionId: pmState.designSessionId,
  schemaData: { tables: {}, enums: {} },
  buildingSchemaId: '',
  latestVersionNumber: 0,
  organizationId: '',
  userId: '',
})

/**
 * Analyze Requirements Node - Requirements Organization
 * Performed by pmAnalysisAgent
 */
export async function analyzeRequirementsNode(
  state: PmAgentState,
  config: RunnableConfig,
): Promise<Partial<PmAgentState>> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'pm'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'analyzeRequirementsNode',
    )
  }
  const { repositories } = configurableResult.value

  const workflowState = createWorkflowStateForLogging(state)
  await logAssistantMessage(
    workflowState,
    repositories,
    'Breaking down your request into structured requirements...',
    assistantRole,
  )

  const schemaText = convertSchemaToText(state.schemaData)

  const analysisResult = await invokePmAnalysisAgent(
    { schemaText },
    state.messages,
    configurableResult.value,
  )

  if (analysisResult.isErr()) {
    throw new WorkflowTerminationError(
      analysisResult.error,
      'analyzeRequirementsNode',
    )
  }

  const { response, reasoning } = analysisResult.value

  if (reasoning?.summary && reasoning.summary.length > 0) {
    for (const summaryItem of reasoning.summary) {
      await logAssistantMessage(
        workflowState,
        repositories,
        summaryItem.text,
        assistantRole,
      )
    }
  }
  return {
    messages: [response],
    analyzedRequirementsRetryCount: state.analyzedRequirementsRetryCount + 1,
  }
}
