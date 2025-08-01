import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
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
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Creating sample data to test your database design...',
    assistantRole,
  )

  // Check if we have required inputs
  if (!state.ddlStatements) {
    await logAssistantMessage(
      state,
      repositories,
      'Database structure not ready yet. Cannot create sample data without the schema...',
      assistantRole,
    )
    return state
  }

  // Check if DDL is empty (no tables)
  if (state.ddlStatements.trim() === '') {
    // Analyze the schema to provide more specific feedback
    const tableCount = Object.keys(state.schemaData?.tables || {}).length
    let errorMessage: string

    if (tableCount === 0) {
      errorMessage =
        'The database schema is empty (no tables defined). Please create at least one table with columns before generating sample data.'
    } else {
      // This is unusual - we have tables but empty DDL
      const tableNames = Object.keys(state.schemaData?.tables || {})
      const tablesWithoutColumns = tableNames.filter((tableName) => {
        const table = state.schemaData?.tables[tableName]
        return !table?.columns || Object.keys(table.columns).length === 0
      })

      if (tablesWithoutColumns.length > 0) {
        errorMessage = `Cannot generate sample data: The following tables have no columns: ${tablesWithoutColumns.join(', ')}. Please add columns to these tables first.`
      } else {
        errorMessage = `The database schema contains ${tableCount} table(s) but no DDL was generated. This may be due to invalid table definitions. Please check your schema structure.`
      }
    }

    await logAssistantMessage(state, repositories, errorMessage, assistantRole)
    return {
      ...state,
      error: new Error('Cannot generate DML for empty or invalid schema'),
    }
  }

  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'Test scenarios not available. Creating minimal sample data for your database...',
      assistantRole,
    )

    // Create minimal DML without use cases - just basic inserts for testing
    const minimalDml = `-- Minimal sample data for testing
-- Add sample data here based on your schema structure`

    return {
      ...state,
      dmlStatements: minimalDml,
      dmlOperations: [],
    }
  }

  // Create DML generation agent
  const dmlAgent = new DMLGenerationAgent()

  // Format use cases for the agent
  const formattedUseCases = formatUseCases(state.generatedUsecases)

  // Convert schema to text for additional context
  const schemaContext = convertSchemaToText(state.schemaData)

  // Generate DML statements
  const result = await dmlAgent.generate({
    schemaSQL: state.ddlStatements,
    formattedUseCases,
    schemaContext,
  })

  // Validate result
  if (!result.dmlOperations || result.dmlOperations.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'No sample data could be generated for your database design...',
      assistantRole,
    )
    return state
  }

  // Convert structured operations back to string format for backward compatibility
  const dmlStatements = result.dmlOperations
    .map((op) => {
      const header = op.description
        ? `-- ${op.description}`
        : `-- ${op.operation_type} operation for use case ${op.useCaseId}`
      return `${header}\n${op.sql};`
    })
    .join('\n\n')

  return {
    ...state,
    dmlStatements,
    dmlOperations: result.dmlOperations,
  }
}
