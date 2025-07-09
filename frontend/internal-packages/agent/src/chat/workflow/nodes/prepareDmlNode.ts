import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { ResultAsync } from 'neverthrow'
import { DMLGenerationAgent } from '../../../langchain/agents'
import type { DMLGenerationPromptVariables } from '../../../langchain/agents/dmlGenerationAgent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'prepareDmlNode'

/**
 * Format use cases for the DML generation agent
 */
function formatUseCases(usecases: Usecase[]): string {
  return usecases
    .map(
      (usecase) => `
Use Case: ${usecase.title}
Type: ${usecase.requirementType}
Category: ${usecase.requirementCategory}
Requirement: ${usecase.requirement}
Description: ${usecase.description}`,
    )
    .join('\n\n')
}

/**
 * Format schema for the DML generation agent
 */
function formatSchema(schemaData: WorkflowState['schemaData']): string {
  // Use the PostgreSQL schema deparser to get a SQL representation
  const deparseResult = postgresqlSchemaDeparser(schemaData)

  if (deparseResult.errors.length > 0) {
    // Fallback to a simple text representation if deparser fails
    const tables = Object.values(schemaData.tables)
      .map((table) => {
        const columns = Object.values(table.columns)
          .map(
            (col) =>
              `  ${col.name} ${col.type}${col.notNull ? ' NOT NULL' : ''}`,
          )
          .join('\n')
        return `Table: ${table.name}\n${columns}`
      })
      .join('\n\n')
    return `Tables:\n${tables}`
  }

  return deparseResult.value
}

/**
 * Prepare DML Node - Generates DML statements for testing using AI agent
 * Based on use cases and schema
 */
export async function prepareDmlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: prepareDML',
        progress: getWorkflowNodeProgress('prepareDML'),
      },
    )
  }

  // Validate prerequisites
  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    const errorMessage = 'No use cases found. Cannot generate DML statements.'
    const error = new Error(`[${NODE_NAME}] ${errorMessage}`)
    state.logger.error(error.message)
    return {
      ...state,
      error,
    }
  }

  if (
    !state.schemaData.tables ||
    Object.keys(state.schemaData.tables).length === 0
  ) {
    const errorMessage =
      'No tables found in schema. Cannot generate DML statements.'
    const error = new Error(`[${NODE_NAME}] ${errorMessage}`)
    state.logger.error(error.message)
    return {
      ...state,
      error,
    }
  }

  // Initialize the DML generation agent
  const dmlAgent = new DMLGenerationAgent()

  // Format use cases and schema for the agent
  const formattedUseCases = formatUseCases(state.generatedUsecases)
  const formattedSchema = formatSchema(state.schemaData)

  const promptVariables: DMLGenerationPromptVariables = {
    chat_history: state.formattedHistory,
    user_message: `Use Cases:\n${formattedUseCases}`,
    schema: formattedSchema,
  }

  state.logger.log(
    `[${NODE_NAME}] Generating DML for ${state.generatedUsecases.length} use cases using AI agent`,
  )

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  const dmlResult = await ResultAsync.fromPromise(
    dmlAgent.generate(promptVariables),
    (error) => (error instanceof Error ? error.message : String(error)),
  )

  if (dmlResult.isErr()) {
    const errorMessage = dmlResult.error
    const error = new Error(`[${NODE_NAME}] Failed: ${errorMessage}`)
    state.logger.error(error.message)

    return {
      ...state,
      error,
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }

  const result = dmlResult.value

  state.logger.log(
    `[${NODE_NAME}] Generated DML for ${state.generatedUsecases.length} use cases`,
  )
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    dmlStatements: result.dmlStatements,
    error: undefined,
  }
}
