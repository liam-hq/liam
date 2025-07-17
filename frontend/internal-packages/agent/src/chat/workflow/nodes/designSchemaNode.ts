import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import {
  invokeDesignAgent,
  schemaDesignTool,
} from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

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

  // Create empty version at the beginning of the node
  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber

  const createVersionResult = await repositories.schema.createEmptyPatchVersion(
    {
      buildingSchemaId,
      latestVersionNumber,
    },
  )

  if (!createVersionResult.success) {
    const errorMessage =
      createVersionResult.error || 'Failed to create new version'
    await logAssistantMessage(state, repositories, 'Version creation failed')
    return {
      ...state,
      error: new Error(errorMessage),
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Created new schema version for updates...',
  )

  const schemaText = convertSchemaToText(state.schemaData)

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

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing table structure and relationships...',
  )

  // Convert messages to BaseMessage array and add user message
  const messages = [...state.messages, new HumanMessage(userMessage)]

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    repositories,
  })

  if (invokeResult.isErr()) {
    await logAssistantMessage(state, repositories, 'Schema design failed')
    return {
      ...state,
      error: invokeResult.error,
    }
  }

  await logAssistantMessage(state, repositories, 'Schema design completed')

  return {
    ...state,
    // schemaData: result.newSchema,
    messages: [invokeResult.value],
    generatedAnswer: invokeResult.value.text,
    error: undefined,
    shouldRetryWithDesignSchema: undefined,
    ddlExecutionFailureReason: undefined,
  }
}

// export const invokeSchemaDesignToolNode = new ToolNode([schemaDesignTool])
export const invokeSchemaDesignToolNode = (
  state: WorkflowState,
  config: RunnableConfig,
) => {
  const toolNode = new ToolNode([schemaDesignTool])

  return toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      buildingSchemaId: state.buildingSchemaId,
      latestVersionNumber: state.latestVersionNumber,
    },
  })
}
