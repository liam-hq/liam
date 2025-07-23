import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import { DMLGenerationAgent } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

/**
 * Format use cases into a structured string for DML generation
 */
function formatUseCases(useCases: Usecase[]): string {
  // Group use cases by requirement category
  const groupedUseCases = useCases.reduce<Record<string, Usecase[]>>(
    (acc, uc) => {
      const category = uc.requirementCategory?.trim() || 'General'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(uc)
      return acc
    },
    {},
  )

  // Format grouped use cases
  const formattedGroups = Object.entries(groupedUseCases).map(
    ([category, cases]) => {
      const formattedCases = cases
        .map(
          (uc) =>
            `  - ${uc.title}: ${uc.description}${
              uc.requirement ? ` (Requirement: ${uc.requirement})` : ''
            }`,
        )
        .join('\n')
      return `${category}:\n${formattedCases}`
    },
  )

  return formattedGroups.join('\n\n')
}

/**
 * Prepare DML Node - Generates DML statements based on schema and use cases
 * Performed by DMLGenerationAgent
 */
export async function prepareDmlNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
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
    'Preparing DML statements...',
    assistantRole,
  )

  // Check if we have required inputs
  if (!state.ddlStatements) {
    await logAssistantMessage(
      state,
      repositories,
      'Missing DDL statements for DML generation',
      assistantRole,
    )
    return state
  }

  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Missing use cases for DML generation',
      assistantRole,
    )
    return state
  }

  // Create DML generation agent
  const dmlAgent = new DMLGenerationAgent()

  // Convert schema to text for additional context
  const schemaContext = convertSchemaToText(state.schemaData)

  // Generate DML operations for each use case
  const dmlOperations: Array<{
    usecase: Usecase
    operations: DMLOperation[]
  }> = []

  for (const usecase of state.generatedUsecases) {
    const result = await dmlAgent.generateDMLForUsecase({
      usecase,
      ddlStatements: state.ddlStatements,
      schemaContext,
    })

    if (result.isErr()) {
      await logAssistantMessage(
        state,
        repositories,
        `Failed to generate DML for use case "${usecase.title}": ${result.error.message}`,
        assistantRole,
      )
      return {
        ...state,
        error: result.error,
      }
    }

    dmlOperations.push({
      usecase,
      operations: result.value,
    })
  }

  // Also generate legacy format for backward compatibility
  const formattedUseCases = formatUseCases(state.generatedUsecases)
  const legacyResult = await dmlAgent.generate({
    schemaSQL: state.ddlStatements,
    formattedUseCases,
    schemaContext,
  })

  // Validate legacy result
  if (
    !legacyResult.dmlStatements ||
    legacyResult.dmlStatements.trim().length === 0
  ) {
    await logAssistantMessage(
      state,
      repositories,
      'DML generation returned empty statements',
      assistantRole,
    )
    return state
  }

  await logAssistantMessage(
    state,
    repositories,
    `DML operations generated successfully for ${dmlOperations.length} use cases`,
    assistantRole,
  )

  return {
    ...state,
    dmlStatements: legacyResult.dmlStatements,
    dmlOperations,
  }
}
