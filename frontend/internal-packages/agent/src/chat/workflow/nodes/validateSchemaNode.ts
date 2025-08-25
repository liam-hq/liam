import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { generateDdlFromSchema } from '../utils/generateDdl'
import { transformWorkflowStateToArtifact } from '../utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

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
  ddlStatements: string,
  usecases: Usecase[],
): Promise<UsecaseDmlExecutionResult[]> {
  const results: UsecaseDmlExecutionResult[] = []

  for (const usecase of usecases) {
    if (!usecase.dmlOperations || usecase.dmlOperations.length === 0) {
      continue
    }

    const sqlParts = []

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
      executeQuery(combinedSql),
      (error) => new Error(String(error)),
    )

    if (executionResult.isOk()) {
      const sqlResults = executionResult.value

      const hasErrors = sqlResults.some((result) => !result.success)
      const errors = sqlResults
        .filter((result) => !result.success)
        .map((result) => {
          // Extract error message from result object
          if (
            typeof result.result === 'object' &&
            result.result !== null &&
            'error' in result.result
          ) {
            return String(result.result.error)
          }
          return String(result.result)
        })

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
  if (!state.generatedUsecases) {
    return state
  }

  const resultMap = new Map(results.map((result) => [result.useCaseId, result]))

  const updatedUsecases = state.generatedUsecases.map((usecase) => {
    const usecaseResult = resultMap.get(usecase.id)

    if (!usecaseResult || !usecase.dmlOperations) {
      return usecase
    }

    const updatedDmlOperations = usecase.dmlOperations.map((dmlOp) => {
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
      ...usecase,
      dmlOperations: updatedDmlOperations,
    }
  })

  return {
    ...state,
    generatedUsecases: updatedUsecases,
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

  const ddlStatements = generateDdlFromSchema(state.schemaData)
  const hasDdl = ddlStatements?.trim()
  const hasUsecases =
    state.generatedUsecases && state.generatedUsecases.length > 0
  const hasDml =
    hasUsecases &&
    state.generatedUsecases?.some(
      (uc) => uc.dmlOperations && uc.dmlOperations.length > 0,
    )

  if (!hasDdl && !hasDml) {
    return state
  }

  let allResults: SqlResult[] = []

  const combinedStatements = [
    hasDdl ? ddlStatements : '',
    hasDml ? 'DML operations executed individually' : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Execute DDL first if present
  if (hasDdl && ddlStatements) {
    const ddlResults: SqlResult[] = await executeQuery(ddlStatements)
    allResults = [...ddlResults]
  }

  let usecaseExecutionResults: UsecaseDmlExecutionResult[] = []
  let updatedState = state
  if (hasDml && state.generatedUsecases) {
    usecaseExecutionResults = await executeDmlOperationsByUsecase(
      ddlStatements || '',
      state.generatedUsecases,
    )

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

    updatedState = updateWorkflowStateWithUsecaseResults(
      state,
      usecaseExecutionResults,
    )

    const artifact = transformWorkflowStateToArtifact(updatedState)
    await repositories.schema.upsertArtifact({
      designSessionId: updatedState.designSessionId,
      artifact,
    })
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

    let validationMessage: string
    if (errorCount === 0) {
      validationMessage =
        'Database validation complete: all checks passed successfully'
    } else {
      const errorDetails = usecaseExecutionResults
        .filter((result) => !result.success)
        .map((result) => {
          const errorMessages = result.errors?.join('\n  - ') || 'Unknown error'
          return `- "${result.useCaseTitle}":\n  - ${errorMessages}`
        })
        .join('\n')

      validationMessage = `Database validation found ${errorCount} issues. Please fix the following errors:\n\n${errorDetails}`
    }

    const validationAIMessage = new AIMessage({
      content: validationMessage,
      name: 'SchemaValidator',
    })

    // Sync with timeline
    const syncedMessage = await withTimelineItemSync(validationAIMessage, {
      designSessionId: state.designSessionId,
      organizationId: state.organizationId || '',
      userId: state.userId,
      repositories,
      assistantRole,
    })

    updatedState = {
      ...updatedState,
      messages: [...state.messages, syncedMessage],
    }
  }

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

  return updatedState
}
