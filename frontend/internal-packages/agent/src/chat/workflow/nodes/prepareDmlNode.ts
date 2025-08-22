import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { DMLGenerationAgent } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { generateDdlFromSchema } from '../utils/generateDdl'
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

  // Format grouped use cases with UUIDs
  const formattedGroups = Object.entries(groupedUseCases).map(
    ([category, cases]) => {
      const formattedCases = cases
        .map(
          (uc) =>
            `  - ID: ${uc.id} | ${uc.title}: ${uc.description}${
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
    throw new WorkflowTerminationError(
      configurableResult.error,
      'prepareDmlNode',
    )
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating sample data to test your database design...',
    assistantRole,
  )

  const ddlStatements = generateDdlFromSchema(state.schemaData)
  if (!ddlStatements) {
    await logAssistantMessage(
      state,
      repositories,
      'Database structure not ready yet. Cannot create sample data without the schema...',
      assistantRole,
    )
    return state
  }

  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Test scenarios not available. Cannot create sample data without use cases...',
      assistantRole,
    )
    return state
  }

  const dmlAgent = new DMLGenerationAgent()

  const formattedUseCases = formatUseCases(state.generatedUsecases)

  const schemaContext = convertSchemaToText(state.schemaData)

  const result = await dmlAgent.generate({
    schemaSQL: ddlStatements,
    formattedUseCases,
    schemaContext,
  })

  if (!result.dmlOperations || result.dmlOperations.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'No sample data could be generated for your database design...',
      assistantRole,
    )
    return state
  }

  const dmlStatements = result.dmlOperations
    .map((op) => {
      const header = op.description
        ? `-- ${op.description}`
        : `-- ${op.operation_type} operation for use case ${op.useCaseId}`
      return `${header}\n${op.sql};`
    })
    .join('\n\n')

  const updatedUsecases = state.generatedUsecases.map((usecase) => {
    const usecaseDmlOperations = result.dmlOperations.filter(
      (op) => op.useCaseId === usecase.id,
    )
    return {
      ...usecase,
      dmlOperations: usecaseDmlOperations,
    }
  })

  return {
    ...state,
    dmlStatements,
    generatedUsecases: updatedUsecases,
  }
}
