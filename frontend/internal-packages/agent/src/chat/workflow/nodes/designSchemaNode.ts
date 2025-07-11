import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { DatabaseSchemaBuildAgent } from '../../../langchain/agents'
import type { BuildAgentResponse } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import type { SchemaAwareChatVariables } from '../../../langchain/utils/types'
import type { Repositories } from '../../../repositories'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { formatMessagesToHistory } from '../utils/messageUtils'
import { logAssistantMessage } from '../utils/timelineLogger'

type PreparedSchemaDesign = {
  agent: DatabaseSchemaBuildAgent
  schemaText: string
}

const formatAnalyzedRequirements = (
  analyzedRequirements: NonNullable<WorkflowState['analyzedRequirements']>,
): string => {
  const formatRequirements = (
    requirements: Record<string, string[]>,
    title: string,
  ): string => {
    const entries = Object.entries(requirements)
    if (entries.length === 0) return ''

    return `${title}:
${entries
  .map(
    ([category, items]) =>
      `- ${category}:\n  ${items.map((item) => `  • ${item}`).join('\n')}`,
  )
  .join('\n')}`
  }

  const sections = [
    `Business Requirement:\n${analyzedRequirements.businessRequirement}`,
    formatRequirements(
      analyzedRequirements.functionalRequirements,
      'Functional Requirements',
    ),
    formatRequirements(
      analyzedRequirements.nonFunctionalRequirements,
      'Non-Functional Requirements',
    ),
  ].filter(Boolean)

  return sections.join('\n\n')
}

const prepareUserMessage = (state: WorkflowState): string => {
  // DDL execution failure takes priority
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    return `The following DDL execution failed: ${state.ddlExecutionFailureReason}
Original request: ${state.userInput}
Please fix this issue by analyzing the schema and adding any missing constraints, primary keys, or other required schema elements to resolve the DDL execution error.`
  }

  // Include analyzed requirements if available
  if (state.analyzedRequirements) {
    return `Based on the following analyzed requirements:
${formatAnalyzedRequirements(state.analyzedRequirements)}
User Request: ${state.userInput}`
  }

  // Default to original user input
  return state.userInput
}

/**
 * Apply schema changes and return updated state
 */
const applySchemaChanges = async (
  schemaChanges: BuildAgentResponse['schemaChanges'],
  buildingSchemaId: string,
  latestVersionNumber: number,
  message: string,
  state: WorkflowState,
  repositories: Repositories,
): Promise<WorkflowState> => {
  await logAssistantMessage(state, repositories, 'Applying schema changes...')

  const result = await repositories.schema.createVersion({
    buildingSchemaId,
    latestVersionNumber,
    patch: schemaChanges,
  })

  if (!result.success) {
    const errorMessage = result.error || 'Failed to update schema'
    await logAssistantMessage(state, repositories, 'Schema update failed')
    return {
      ...state,
      generatedAnswer: message,
      error: new Error(errorMessage),
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    `Applied ${schemaChanges.length} schema changes successfully`,
  )

  return {
    ...state,
    schemaData: result.newSchema,
    generatedAnswer: message,
    error: undefined,
  }
}

/**
 * Handle schema changes if they exist
 */
const handleSchemaChanges = async (
  parsedResponse: BuildAgentResponse,
  state: WorkflowState,
  repositories: Repositories,
): Promise<WorkflowState> => {
  if (parsedResponse.schemaChanges.length === 0) {
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
    }
  }

  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber

  return await applySchemaChanges(
    parsedResponse.schemaChanges,
    buildingSchemaId,
    latestVersionNumber,
    parsedResponse.message,
    state,
    repositories,
  )
}

async function prepareSchemaDesign(
  state: WorkflowState,
  repositories: Repositories,
): Promise<PreparedSchemaDesign> {
  await logAssistantMessage(state, repositories, 'Preparing schema design...')

  const schemaText = convertSchemaToText(state.schemaData)

  // Create the agent instance
  const agent = new DatabaseSchemaBuildAgent()

  await logAssistantMessage(
    state,
    repositories,
    'Schema design preparation completed',
  )

  return {
    agent,
    schemaText,
  }
}

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(state, repositories, 'Designing database schema...')

  const { agent, schemaText } = await prepareSchemaDesign(state, repositories)

  // Prepare user message with context
  const userMessage = prepareUserMessage(state)

  // Log appropriate message for DDL retry case
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    await logAssistantMessage(
      state,
      repositories,
      'Redesigning schema to fix DDL execution errors...',
    )
  }

  // Create prompt variables directly
  const promptVariables: SchemaAwareChatVariables = {
    schema_text: schemaText,
    chat_history: formatMessagesToHistory(state.messages),
    user_message: userMessage,
  }

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing table structure and relationships...',
  )

  // Use agent's generate method with prompt variables
  const response = await agent.generate(promptVariables)
  const result = await handleSchemaChanges(response, state, repositories)

  await logAssistantMessage(state, repositories, 'Schema design completed')

  // Clear retry flags after processing
  const finalResult = {
    ...result,
    messages: [
      ...state.messages,
      new AIMessage({
        content: response.message,
        name: 'Database Schema Build Agent',
      }),
    ],
    shouldRetryWithDesignSchema: undefined,
    ddlExecutionFailureReason: undefined,
  }

  return finalResult
}
