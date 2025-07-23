import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { DMLOperation } from '../../../langchain/agents/dmlGenerationAgent/agent'
import type { Repositories } from '../../../repositories'
import { WORKFLOW_RETRY_CONFIG } from '../constants'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

// Helper functions to reduce complexity
async function executeDDL(
  state: WorkflowState,
  repositories: Repositories,
  allResults: SqlResult[],
  allErrors: string[],
): Promise<void> {
  if (!state.ddlStatements) return

  const ddlResults = await executeQuery(
    state.designSessionId,
    state.ddlStatements,
  )
  allResults.push(...ddlResults)

  // Save DDL execution results
  const ddlQueryResult = await repositories.schema.createValidationQuery({
    designSessionId: state.designSessionId,
    queryString: state.ddlStatements,
  })

  if (ddlQueryResult.success) {
    await repositories.schema.createValidationResults({
      validationQueryId: ddlQueryResult.queryId,
      results: ddlResults,
    })
  }

  // Check for DDL errors
  const ddlErrors = ddlResults.filter((r) => !r.success)
  ddlErrors.forEach((error) => {
    allErrors.push(
      `DDL Error - SQL: ${error.sql}, Error: ${JSON.stringify(error.result)}`,
    )
  })
}

async function executeDMLOperations(
  state: WorkflowState,
  repositories: Repositories,
  allResults: SqlResult[],
  allErrors: string[],
  dmlExecutionResults: NonNullable<WorkflowState['dmlExecutionResults']>,
): Promise<void> {
  if (!state.dmlOperations) return

  for (const usecaseOperations of state.dmlOperations) {
    const { usecase, operations } = usecaseOperations
    const operationResults: Array<{
      operation: DMLOperation
      result: SqlResult
    }> = []

    for (const operation of operations) {
      const dmlResults = await executeQuery(
        state.designSessionId,
        operation.sql,
      )
      allResults.push(...dmlResults)

      // Save each DML operation result
      const dmlQueryResult = await repositories.schema.createValidationQuery({
        designSessionId: state.designSessionId,
        queryString: operation.sql,
      })

      if (dmlQueryResult.success) {
        await repositories.schema.createValidationResults({
          validationQueryId: dmlQueryResult.queryId,
          results: dmlResults,
        })
      }

      // Store operation result for artifact
      if (dmlResults.length > 0 && dmlResults[0]) {
        operationResults.push({
          operation,
          result: dmlResults[0], // Take the first result for each operation
        })
      }

      // Check for DML errors
      const dmlErrors = dmlResults.filter((r) => !r.success)
      dmlErrors.forEach((error) => {
        allErrors.push(
          `Use case: ${usecase.title} - ${operation.purpose} - SQL: ${error.sql}, Error: ${JSON.stringify(error.result)}`,
        )
      })
    }

    // Store results for this usecase
    dmlExecutionResults.push({
      usecase,
      operationResults,
    })
  }
}

async function executeLegacyDML(
  state: WorkflowState,
  repositories: Repositories,
  allResults: SqlResult[],
  allErrors: string[],
): Promise<void> {
  if (!state.dmlStatements) return

  const dmlResults = await executeQuery(
    state.designSessionId,
    state.dmlStatements,
  )
  allResults.push(...dmlResults)

  const dmlQueryResult = await repositories.schema.createValidationQuery({
    designSessionId: state.designSessionId,
    queryString: state.dmlStatements,
  })

  if (dmlQueryResult.success) {
    await repositories.schema.createValidationResults({
      validationQueryId: dmlQueryResult.queryId,
      results: dmlResults,
    })
  }

  // Check for DML errors
  const dmlErrors = dmlResults.filter((r) => !r.success)
  dmlErrors.forEach((error) => {
    allErrors.push(`SQL: ${error.sql}, Error: ${JSON.stringify(error.result)}`)
  })
}

/**
 * Validate Schema Node - Combined DDL/DML Execution & Validation
 * Executes DDL and DML together in a single query to validate schema with test data
 */
export async function validateSchemaNode(
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

  // Check if we have any statements to execute
  const hasDdl = state.ddlStatements?.trim()
  const hasDml = state.dmlStatements?.trim()
  const hasDmlOperations = state.dmlOperations && state.dmlOperations.length > 0

  if (!hasDdl && !hasDml && !hasDmlOperations) {
    return state
  }

  const allResults: SqlResult[] = []
  const allErrors: string[] = []
  const dmlExecutionResults: NonNullable<WorkflowState['dmlExecutionResults']> =
    []

  // Execute DDL first if present
  if (hasDdl) {
    await executeDDL(state, repositories, allResults, allErrors)
  }

  // Execute DML operations individually if present
  if (hasDmlOperations && state.dmlOperations) {
    await executeDMLOperations(
      state,
      repositories,
      allResults,
      allErrors,
      dmlExecutionResults,
    )
  } else if (hasDml && !hasDmlOperations) {
    // Legacy path: execute combined DML statements
    await executeLegacyDML(state, repositories, allResults, allErrors)
  }

  // Log overall results
  const successCount = allResults.filter((r) => r.success).length
  const errorCount = allResults.length - successCount
  await logAssistantMessage(
    state,
    repositories,
    `Schema Validation Complete: ${successCount} successful, ${errorCount} failed queries`,
    assistantRole,
  )

  // Return results
  if (allErrors.length > 0) {
    const errorMessage = allErrors.join('; ')

    await logAssistantMessage(
      state,
      repositories,
      'Error occurred during DML validation',
      assistantRole,
    )

    // Check if this is the first failure or if we've already retried
    const currentRetryCount = state.retryCount['dmlValidationRetry'] || 0

    if (currentRetryCount < WORKFLOW_RETRY_CONFIG.MAX_DML_VALIDATION_RETRIES) {
      // Set up retry with designSchemaNode
      await logAssistantMessage(
        state,
        repositories,
        'Redesigning schema to fix validation errors...',
        assistantRole,
      )

      return {
        ...state,
        error: new Error('DML validation failed'),
        dmlExecutionErrors: errorMessage,
        dmlValidationFailureReason: errorMessage,
        retryCount: {
          ...state.retryCount,
          dmlValidationRetry: currentRetryCount + 1,
        },
      }
    }

    // Already retried - mark as permanently failed
    await logAssistantMessage(
      state,
      repositories,
      'Unable to resolve DML validation errors after retry',
      assistantRole,
    )

    return {
      ...state,
      dmlExecutionErrors: errorMessage,
      dmlValidationFailureReason: errorMessage,
    }
  }

  return {
    ...state,
    dmlExecutionSuccessful: true,
    dmlExecutionResults:
      dmlExecutionResults.length > 0 ? dmlExecutionResults : undefined,
  }
}
