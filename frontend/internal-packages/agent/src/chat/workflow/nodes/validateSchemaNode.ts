import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import {
  createOrUpdateArtifact,
  transformWorkflowStateToArtifact,
} from '../utils/transformWorkflowStateToArtifact'

type UsecaseDmlExecutionResult = {
  useCaseId: string
  useCaseTitle: string
  success: boolean
  executedOperations: number
  errors?: string[]
  executedAt: Date
}

/**
 * Execute DML operations by usecase with DDL statements
 * Combines DDL and usecase-specific DML into single execution units
 */
async function executeDmlOperationsByUsecase(
  sessionId: string,
  ddlStatements: string,
  usecases: Usecase[],
): Promise<UsecaseDmlExecutionResult[]> {
  const results: UsecaseDmlExecutionResult[] = []

  for (const usecase of usecases) {
    if (!usecase.dmlOperations || usecase.dmlOperations.length === 0) {
      continue
    }

    // Build combined SQL for this usecase
    const sqlParts = []

    // Only include DDL if it exists
    if (ddlStatements.trim()) {
      sqlParts.push('-- DDL Statements', ddlStatements, '')
    }

    sqlParts.push(
      `-- UseCase: ${usecase.id}`,
      `-- ${usecase.title}`,
      ...usecase.dmlOperations.map((op) => {
        const header = op.description
          ? `-- ${op.description}`
          : `-- ${op.operation_type} operation`
        return `${header}\n${op.sql};`
      }),
    )

    const combinedSql = sqlParts.filter(Boolean).join('\n')

    const startTime = new Date()
    const executionResult = await ResultAsync.fromPromise(
      executeQuery(sessionId, combinedSql),
      (error) => new Error(String(error)),
    )

    if (executionResult.isOk()) {
      const sqlResults = executionResult.value

      // Check if all operations succeeded
      const hasErrors = sqlResults.some((result) => !result.success)
      const errors = sqlResults
        .filter((result) => !result.success)
        .map((result) => String(result.result))

      results.push({
        useCaseId: usecase.id,
        useCaseTitle: usecase.title,
        success: !hasErrors,
        executedOperations: usecase.dmlOperations.length,
        ...(hasErrors && { errors }),
        executedAt: startTime,
      })
    } else {
      results.push({
        useCaseId: usecase.id,
        useCaseTitle: usecase.title,
        success: false,
        executedOperations: 0,
        errors: [executionResult.error.message],
        executedAt: startTime,
      })
    }
  }

  return results
}

/**
 * Update workflow state with usecase-based execution results
 */
function updateWorkflowStateWithUsecaseResults(
  state: WorkflowState,
  results: UsecaseDmlExecutionResult[],
): WorkflowState {
  if (!state.generatedUsecases || !state.dmlOperations) {
    return state
  }

  // Create a map of usecase results for quick lookup
  const resultMap = new Map(results.map((result) => [result.useCaseId, result]))

  const updatedDmlOperations = state.dmlOperations.map((dmlOp) => {
    const usecaseResult = resultMap.get(dmlOp.useCaseId)

    if (!usecaseResult) {
      return dmlOp
    }

    const executionLog = {
      executed_at: usecaseResult.executedAt.toISOString(),
      success: usecaseResult.success,
      result_summary: usecaseResult.success
        ? `UseCase "${usecaseResult.useCaseTitle}" operations completed successfully`
        : `UseCase "${usecaseResult.useCaseTitle}" failed: ${usecaseResult.errors?.join('; ')}`,
    }

    return {
      ...dmlOp,
      dml_execution_logs: [executionLog],
    }
  })

  return {
    ...state,
    dmlOperations: updatedDmlOperations,
  }
}

/**
 * Validate Schema Node - Individual DML Execution & Result Mapping
 * Executes DDL first, then DML operations individually to associate results with use cases
 */
export async function validateSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'validateSchemaNode',
    )
  }
  const { repositories } = configurableResult.value

  // Check if we have any statements to execute
  const hasDdl = state.ddlStatements?.trim()
  const hasDml = state.dmlOperations && state.dmlOperations.length > 0
  const hasUsecases =
    state.generatedUsecases && state.generatedUsecases.length > 0

  if (!hasDdl && !hasDml) {
    return state
  }

  let allResults: SqlResult[] = []

  const combinedStatements = [
    hasDdl ? state.ddlStatements : '',
    hasDml ? 'DML operations executed individually' : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Execute DDL first if present
  if (hasDdl && state.ddlStatements) {
    const ddlResults: SqlResult[] = await executeQuery(
      state.designSessionId,
      state.ddlStatements,
    )
    allResults = [...ddlResults]
  }

  // Execute DML operations by usecase if present
  let usecaseExecutionResults: UsecaseDmlExecutionResult[] = []
  let updatedState = state
  if (hasDml && hasUsecases && state.generatedUsecases) {
    usecaseExecutionResults = await executeDmlOperationsByUsecase(
      state.designSessionId,
      state.ddlStatements || '',
      state.generatedUsecases,
    )

    // Convert usecase results to SqlResult format for logging
    const dmlSqlResults: SqlResult[] = usecaseExecutionResults.map(
      (result) => ({
        sql: `UseCase: ${result.useCaseTitle}`,
        result: result.success
          ? { executedOperations: result.executedOperations }
          : { errors: result.errors },
        success: result.success,
        id: `usecase-${result.useCaseId}`,
        metadata: {
          executionTime: 0,
          timestamp: result.executedAt.toISOString(),
        },
      }),
    )
    allResults = [...allResults, ...dmlSqlResults]

    // Update workflow state with execution results
    updatedState = updateWorkflowStateWithUsecaseResults(
      state,
      usecaseExecutionResults,
    )

    // Update artifact with the new state
    const artifact = transformWorkflowStateToArtifact(updatedState)
    await createOrUpdateArtifact(updatedState, artifact, repositories)
  }

  const results = allResults

  const queryResult = await repositories.schema.createValidationQuery({
    designSessionId: state.designSessionId,
    queryString: combinedStatements,
  })

  if (queryResult.success) {
    await repositories.schema.createValidationResults({
      validationQueryId: queryResult.queryId,
      results,
    })

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.length - successCount
    const validationMessage =
      errorCount === 0
        ? 'Database validation complete: all checks passed successfully'
        : `Database validation found ${errorCount} issues that need attention`

    await logAssistantMessage(
      state,
      repositories,
      validationMessage,
      assistantRole,
    )
  }

  // Check for execution errors
  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    return {
      ...updatedState,
      dmlExecutionErrors: errorMessages,
    }
  }

  return {
    ...updatedState,
    dmlExecutionSuccessful: true,
  }
}
