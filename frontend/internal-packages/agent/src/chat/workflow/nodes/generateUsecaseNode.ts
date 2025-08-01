import { AIMessage, HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'
import { ResultAsync } from 'neverthrow'
import { QAGenerateUsecaseAgent } from '../../../langchain/agents'
import type { Repositories } from '../../../repositories'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Generate inferred requirements from schema data
 */
function generateInferredRequirements(schemaData: Schema): string {
  const tableNames = Object.keys(schemaData.tables)
  if (tableNames.length === 0) {
    return 'No specific requirements available. Please generate use cases based on the database schema provided.'
  }

  const requirements: string[] = []

  for (const tableName of tableNames) {
    const table = schemaData.tables[tableName]
    if (!table) continue

    // Basic CRUD requirement for each table
    const displayName = tableName.replace(/_/g, ' ')
    requirements.push(
      `${displayName} management - Create, read, update, and delete ${displayName} records`,
    )

    // Add table-specific comment as requirement if available
    if (table.comment) {
      requirements.push(`${table.comment}`)
    }
  }

  return `Inferred functional requirements from database schema:

${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

Non-functional requirements:
- Data integrity and consistency across all table operations
- Performance optimization for database queries and operations
- Security measures for data access and modification`
}

/**
 * Save artifacts if workflow state contains artifact data
 */
async function saveArtifacts(
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<void> {
  if (!state.analyzedRequirements && !state.generatedUsecases) {
    return
  }

  const artifact = transformWorkflowStateToArtifact(state)
  const artifactResult = await createOrUpdateArtifact(
    state,
    artifact,
    repositories,
  )

  if (artifactResult.success) {
    await logAssistantMessage(
      state,
      repositories,
      'Your use cases have been saved and are ready for implementation',
      assistantRole,
    )
  } else {
    await logAssistantMessage(
      state,
      repositories,
      'Unable to save your use cases. Please try again or contact support...',
      assistantRole,
    )
  }
}

/**
 * Generate Usecase Node - QA Agent creates use cases
 * Performed by qaGenerateUsecaseAgent
 */
export async function generateUsecaseNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'qa'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating test scenarios to validate your database design...',
    assistantRole,
  )

  // Check if we have analyzed requirements
  if (!state.analyzedRequirements) {
    // If no analyzed requirements but we have schema data, infer from schema
    if (
      !state.schemaData ||
      Object.keys(state.schemaData.tables).length === 0
    ) {
      const errorMessage =
        'No analyzed requirements or schema data found. Cannot generate use cases.'

      await logAssistantMessage(
        state,
        repositories,
        'Unable to generate test scenarios. No requirements or schema data available...',
        assistantRole,
      )

      return {
        ...state,
        error: new Error(errorMessage),
      }
    }

    // Log that we're proceeding without formal requirements analysis
    await logAssistantMessage(
      state,
      repositories,
      'Generating test scenarios based on database schema and conversation context...',
      assistantRole,
    )
  }

  const qaAgent = new QAGenerateUsecaseAgent()

  const retryCount = state.retryCount['generateUsecaseNode'] ?? 0
  
  // Check max retry limit to prevent infinite loops
  if (retryCount >= 3) {
    console.error('[ERROR generateUsecaseNode] Max retries exceeded:', retryCount)
    await logAssistantMessage(
      state,
      repositories,
      'Unable to generate test scenarios after multiple attempts. Please check the requirements and try again.',
      assistantRole,
    )
    return {
      ...state,
      error: new Error('Max retry limit exceeded for use case generation'),
    }
  }

  // Prepare messages for QA Agent
  let messagesToUse = state.messages

  // If no analyzed requirements, add inferred requirements from schema
  if (!state.analyzedRequirements && state.schemaData) {
    const inferredRequirements = generateInferredRequirements(state.schemaData)

    // Add inferred requirements as a human message to provide context
    const requirementsMessage = new HumanMessage({
      content: `Please generate use cases based on the following requirements and database schema:

${inferredRequirements}

Database Schema:
${JSON.stringify(state.schemaData, null, 2)}`,
    })

    messagesToUse = [...state.messages, requirementsMessage]
  }

  // Use prepared messages - includes error messages and all context
  const usecaseResult = await ResultAsync.fromPromise(
    qaAgent.generate(messagesToUse),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  return await usecaseResult.match(
    async ({ response, reasoning }) => {
      console.log('[SUCCESS generateUsecaseNode] QA Agent generated usecases:', {
        usecaseCount: response.usecases.length,
        hasReasoning: !!reasoning,
      })
      
      // Log reasoning summary if available
      if (reasoning?.summary && reasoning.summary.length > 0) {
        for (const summaryItem of reasoning.summary) {
          await logAssistantMessage(
            state,
            repositories,
            summaryItem.text,
            assistantRole,
          )
        }
      }

      const usecaseMessage = await withTimelineItemSync(
        new AIMessage({
          content: `Generated ${response.usecases.length} use cases for testing and validation`,
          name: 'QAGenerateUsecaseAgent',
        }),
        {
          designSessionId: state.designSessionId,
          organizationId: state.organizationId || '',
          userId: state.userId,
          repositories,
          assistantRole,
        },
      )

      const updatedState = {
        ...state,
        messages: [usecaseMessage],
        generatedUsecases: response.usecases,
        error: undefined, // Clear error on success
      }

      // Save artifacts if usecases are successfully generated
      await saveArtifacts(updatedState, repositories, assistantRole)

      return updatedState
    },
    async (error) => {
      console.error('[ERROR generateUsecaseNode] QA Agent failed:', error)
      
      await logAssistantMessage(
        state,
        repositories,
        'Unable to generate test scenarios. This might be due to unclear requirements...',
        assistantRole,
      )

      // Increment retry count and set error
      return {
        ...state,
        error: error,
        retryCount: {
          ...state.retryCount,
          ['generateUsecaseNode']: retryCount + 1,
        },
      }
    },
  )
}
