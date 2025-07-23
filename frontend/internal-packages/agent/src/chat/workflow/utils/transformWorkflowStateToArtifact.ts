import type {
  Artifact,
  FunctionalRequirement,
  NonFunctionalRequirement,
} from '@liam-hq/artifact'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import type { Repositories } from '../../../repositories'
import type { WorkflowState } from '../types'

/**
 * Transform WorkflowState to Artifact format
 * This handles the conversion from the workflow's data structure to the artifact schema
 */
export const transformWorkflowStateToArtifact = (
  state: WorkflowState,
): Artifact => {
  const businessRequirement =
    state.analyzedRequirements?.businessRequirement ?? ''
  const usecases = state.generatedUsecases || []

  // Create a map of DML operations by usecase title for quick lookup
  const dmlOperationsByUsecase = new Map<string, DMLOperation[]>()
  if (state.dmlOperations) {
    for (const { usecase, operations } of state.dmlOperations) {
      dmlOperationsByUsecase.set(usecase.title, operations)
    }
  }

  // Create a map of DML execution results by usecase title
  const dmlResultsByUsecase = new Map<
    string,
    Array<{ operation: DMLOperation; result: SqlResult }>
  >()
  if (state.dmlExecutionResults) {
    for (const { usecase, operationResults } of state.dmlExecutionResults) {
      dmlResultsByUsecase.set(usecase.title, operationResults)
    }
  }

  // Group use cases by requirement category and type
  const requirementGroups = groupUsecasesByRequirement(usecases)

  // Convert grouped requirements to the artifact format
  const requirements = Object.entries(requirementGroups).map(
    ([category, data]) => {
      const { type, usecases: groupedUsecases, description } = data

      if (type === 'functional') {
        const functionalRequirement: FunctionalRequirement = {
          type: 'functional',
          name: category,
          description: description || `Functional requirement: ${category}`,
          use_cases: groupedUsecases.map((usecase) => {
            // Get DML operations for this use case
            const operations = dmlOperationsByUsecase.get(usecase.title) || []
            const operationResults =
              dmlResultsByUsecase.get(usecase.title) || []

            return {
              title: usecase.title,
              description: usecase.description,
              dml_operations: operations.map((op) => {
                // Find the execution result for this operation
                const operationResult = operationResults.find(
                  (result) => result.operation.sql === op.sql,
                )

                if (!operationResult) {
                  return {
                    sql: op.sql,
                    operation_type: op.operationType,
                    dml_execution_logs: [],
                  }
                }

                const sqlResult = operationResult.result

                return {
                  sql: op.sql,
                  operation_type: op.operationType,
                  dml_execution_logs: [
                    {
                      executed_at: sqlResult.metadata.timestamp,
                      success: sqlResult.success,
                      result_summary: sqlResult.success
                        ? 'Query executed successfully.'
                        : `Query failed: ${JSON.stringify(sqlResult.result)}`,
                    },
                  ],
                }
              }),
            }
          }),
        }
        return functionalRequirement
      }

      const nonFunctionalRequirement: NonFunctionalRequirement = {
        type: 'non_functional',
        name: category,
        description: description || `Non-functional requirement: ${category}`,
      }
      return nonFunctionalRequirement
    },
  )

  return {
    requirement_analysis: {
      business_requirement: businessRequirement,
      requirements,
    },
  }
}

/**
 * Group use cases by requirement category and type
 */
const groupUsecasesByRequirement = (usecases: Usecase[]) => {
  const groups: Record<
    string,
    {
      type: 'functional' | 'non_functional'
      usecases: Usecase[]
      description?: string
    }
  > = {}

  for (const usecase of usecases) {
    const category = usecase.requirementCategory

    if (!groups[category]) {
      groups[category] = {
        type: usecase.requirementType,
        usecases: [],
        description: usecase.requirement, // Use the first requirement description
      }
    }

    groups[category].usecases.push(usecase)
  }

  return groups
}

/**
 * Create an artifact with upsert logic
 * Tries to update existing artifact first, creates new one if not found
 */
export const createOrUpdateArtifact = async (
  state: WorkflowState,
  artifact: Artifact,
  repositories: Repositories,
): Promise<{ success: boolean; error?: string }> => {
  // Try to get existing artifact first
  const existingResult = await repositories.schema.getArtifact(
    state.designSessionId,
  )

  if (existingResult.success) {
    // Artifact exists, update it
    const updateResult = await repositories.schema.updateArtifact({
      designSessionId: state.designSessionId,
      artifact,
    })

    if (updateResult.success) {
      return { success: true }
    }
    return {
      success: false,
      error: !updateResult.success ? updateResult.error : 'Update failed',
    }
  }

  // Check if the failure is due to "not found" vs actual error
  if (
    !existingResult.success &&
    existingResult.error !== 'Artifact not found'
  ) {
    return { success: false, error: existingResult.error }
  }

  // Artifact doesn't exist, create new one
  const createResult = await repositories.schema.createArtifact({
    designSessionId: state.designSessionId,
    artifact,
  })

  if (createResult.success) {
    return { success: true }
  }
  return {
    success: false,
    error: !createResult.success ? createResult.error : 'Create failed',
  }
}
