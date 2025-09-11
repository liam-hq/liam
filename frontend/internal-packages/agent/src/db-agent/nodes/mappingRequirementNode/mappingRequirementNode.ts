import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Schema, Table } from '@liam-hq/schema'
import { WorkflowTerminationError } from '../../../utils/errorHandling'
import { getConfigurable } from '../../../utils/getConfigurable'
import type { AnalyzedRequirements } from '../../../utils/schema/analyzedRequirements'
import type { DbAgentState } from '../../shared/dbAgentAnnotation'

const NODE_NAME = 'mappingRequirementNode'

interface RequirementTableMapping {
  requirementKey: string
  requirementItems: string[]
  relatedTables: string[]
}

export async function mappingRequirementNode(
  state: DbAgentState,
  config: RunnableConfig,
): Promise<DbAgentState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(configurableResult.error, NODE_NAME)
  }

  // Extract schema and requirements from state
  const { schemaData } = state
  if (!schemaData) {
    throw new WorkflowTerminationError(
      new Error('Schema data is missing in state'),
      NODE_NAME,
    )
  }

  // Get analyzed requirements from the last message
  const lastMessage = state.messages[state.messages.length - 1]
  if (!lastMessage || typeof lastMessage.content !== 'string') {
    throw new WorkflowTerminationError(
      new Error('No analyzed requirements found in messages'),
      NODE_NAME,
    )
  }

  let analyzedRequirements: AnalyzedRequirements
  try {
    analyzedRequirements = JSON.parse(lastMessage.content)
  } catch (error) {
    throw new WorkflowTerminationError(
      new Error(
        `Failed to parse analyzed requirements: ${error instanceof Error ? error.message : String(error)}`,
      ),
      NODE_NAME,
    )
  }

  // Perform the mapping between requirements and tables
  const mappings = await mapRequirementsToTables(
    schemaData,
    analyzedRequirements,
  )

  // Create an AIMessage with the mapping results
  const mappingMessage = new AIMessage({
    content: JSON.stringify({
      type: 'requirement_table_mapping',
      mappings,
    }),
  })

  // Return updated state with mapping information in messages
  return {
    ...state,
    messages: [...state.messages, mappingMessage],
  }
}

/**
 * Maps requirements to database tables based on keyword matching and semantic analysis
 */
async function mapRequirementsToTables(
  schema: Schema,
  requirements: AnalyzedRequirements,
): Promise<RequirementTableMapping[]> {
  const mappings: RequirementTableMapping[] = []
  const tables = schema.tables || {}

  // Map functional requirements to tables
  for (const [requirementKey, requirementItems] of Object.entries(
    requirements.functionalRequirements,
  )) {
    const relatedTables = findRelatedTablesForRequirement(
      requirementKey,
      requirementItems,
      tables,
    )

    mappings.push({
      requirementKey,
      requirementItems,
      relatedTables,
    })
  }

  // Map non-functional requirements to tables
  for (const [requirementKey, requirementItems] of Object.entries(
    requirements.nonFunctionalRequirements,
  )) {
    const relatedTables = findRelatedTablesForRequirement(
      requirementKey,
      requirementItems,
      tables,
    )

    mappings.push({
      requirementKey,
      requirementItems,
      relatedTables,
    })
  }

  return mappings
}

/**
 * Finds related tables for a specific requirement
 * TODO(human): Implement the logic to match requirements with tables
 */
function findRelatedTablesForRequirement(
  _requirementKey: string,
  _requirementItems: string[],
  _tables: Record<string, Table>,
): string[] {
  // TODO(human): Implement matching logic here
  // Consider:
  // 1. Extract keywords from requirement key and items
  // 2. Match against table names, column names, and comments
  // 3. Use semantic similarity for better matching
  // 4. Return list of related table names
  return []
}
