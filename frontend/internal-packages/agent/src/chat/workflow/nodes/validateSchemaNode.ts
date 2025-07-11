import type { RunnableConfig } from '@langchain/core/runnables'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../shared/getConfigurable'
import type { DMLExecutionResult, WorkflowState } from '../types'
import {
  logAssistantMessage,
  logDMLExecutionResult,
} from '../utils/timelineLogger'

/**
 * Validate Schema Node - DML Execution & Validation
 * Performed by qaAgent
 */
export async function validateSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
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
    'Executing DML statements for validation...',
  )

  if (!state.dmlStatements) {
    await logAssistantMessage(
      state,
      repositories,
      'No DML statements to execute for validation',
    )
    return state
  }

  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    await logAssistantMessage(
      state,
      repositories,
      'No use cases available for DML validation',
    )
    return state
  }

  const dmlStatements = state.dmlStatements
    .split(';')
    .filter((stmt) => stmt.trim())

  for (const usecase of state.generatedUsecases) {
    const usecaseStatements = dmlStatements

    if (usecaseStatements.length === 0) {
      continue
    }

    const startTime = Date.now()
    const results: SqlResult[] = []

    for (const statement of usecaseStatements) {
      const statementResult = await ResultAsync.fromPromise(
        executeQuery(state.designSessionId, statement.trim()),
        (error) => (error instanceof Error ? error.message : String(error)),
      )

      statementResult.match(
        (statementResults) => {
          results.push(...statementResults)
        },
        (error) => {
          results.push({
            sql: statement.trim(),
            result: { error },
            success: false,
            id: `error-${Date.now()}`,
            metadata: {
              executionTime: 0,
              timestamp: new Date().toISOString(),
            },
          })
        },
      )
    }

    const executionTime = Date.now() - startTime
    const hasErrors = results.some((result: SqlResult) => !result.success)

    const dmlExecutionResult: DMLExecutionResult = {
      usecase: usecase.title,
      statements: usecaseStatements,
      results,
      executionTime,
      success: !hasErrors,
      errors: hasErrors
        ? results
            .filter((result: SqlResult) => !result.success)
            .map(
              (result: SqlResult) =>
                `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
            )
        : undefined,
    }

    await logDMLExecutionResult(state, repositories, dmlExecutionResult)
  }

  await logAssistantMessage(state, repositories, 'DML validation completed')

  return {
    ...state,
  }
}
