import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { DmlOperation } from '@liam-hq/artifact'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import { generateDdlFromSchema } from '../../chat/workflow/utils/generateDdl'
import { transformWorkflowStateToArtifact } from '../../chat/workflow/utils/transformWorkflowStateToArtifact'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import type { Testcase } from '../types'
import { formatValidationErrors } from './formatValidationErrors'
import type { TestcaseDmlExecutionResult } from './types'

function isErrorResult(value: unknown): value is { error: unknown } {
  return typeof value === 'object' && value !== null && 'error' in value
}

/**
 * Build combined SQL for DDL and testcase DML
 */
function buildCombinedSql(ddlStatements: string, testcase: Testcase): string {
  const sqlParts = []

  if (ddlStatements.trim()) {
    sqlParts.push('-- DDL Statements', ddlStatements, '')
  }

  const op: DmlOperation = testcase.dmlOperation
  const header = op.description
    ? `-- ${op.description}`
    : `-- ${op.operation_type} operation`
  sqlParts.push(
    `-- Test Case: ${testcase.id}`,
    `-- ${testcase.title}`,
    `${header}\n${op.sql};`,
  )

  return sqlParts.filter(Boolean).join('\n')
}

/**
 * Extract failed operation from SQL results
 */
function extractFailedOperation(
  sqlResults: SqlResult[],
): { sql: string; error: string } | undefined {
  const firstFailed = sqlResults.find((r) => !r.success)
  if (!firstFailed) {
    return undefined
  }

  const error = isErrorResult(firstFailed.result)
    ? String(firstFailed.result.error)
    : String(firstFailed.result)

  return { sql: firstFailed.sql, error }
}

/**
 * Execute DML operations by testcase with DDL statements
 * Combines DDL and testcase-specific DML into single execution units
 */
async function executeDmlOperationsByTestcase(
  ddlStatements: string,
  testcases: Testcase[],
  requiredExtensions: string[],
): Promise<TestcaseDmlExecutionResult[]> {
  const results: TestcaseDmlExecutionResult[] = []

  for (const testcase of testcases) {
    const combinedSql = buildCombinedSql(ddlStatements, testcase)
    const startTime = new Date()

    const executionResult = await ResultAsync.fromPromise(
      executeQuery(combinedSql, requiredExtensions),
      (error) => new Error(String(error)),
    )

    if (executionResult.isOk()) {
      const sqlResults = executionResult.value
      const hasErrors = sqlResults.some((result) => !result.success)
      const failedOperation = hasErrors
        ? extractFailedOperation(sqlResults)
        : undefined

      results.push({
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
        success: !hasErrors,
        ...(hasErrors && failedOperation && { failedOperation }),
        executedAt: startTime,
      })
    } else {
      results.push({
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
        success: false,
        failedOperation: {
          sql: testcase.dmlOperation.sql,
          error: executionResult.error.message,
        },
        executedAt: startTime,
      })
    }
  }

  return results
}

/**
 * Update workflow state with testcase-based execution results
 */
function updateWorkflowStateWithTestcaseResults(
  state: QaAgentState,
  results: TestcaseDmlExecutionResult[],
): QaAgentState {
  if (state.testcases.length === 0) {
    return state
  }

  const resultMap = new Map(
    results.map((result) => [result.testCaseId, result]),
  )

  const updatedTestcases = state.testcases.map((testcase) => {
    const testcaseResult = resultMap.get(testcase.id)

    if (!testcaseResult) {
      return testcase
    }

    const dmlOp: DmlOperation = testcase.dmlOperation
    const executionLog = {
      executed_at: testcaseResult.executedAt.toISOString(),
      success: testcaseResult.success,
      result_summary: testcaseResult.success
        ? `Test Case "${testcaseResult.testCaseTitle}" operations completed successfully`
        : `Test Case "${testcaseResult.testCaseTitle}" failed: ${testcaseResult.failedOperation?.error ?? 'Unknown error'}`,
    }

    const updatedDmlOperation = {
      ...dmlOp,
      dml_execution_logs: [executionLog],
    }

    return {
      ...testcase,
      dmlOperation: updatedDmlOperation,
    }
  })

  return {
    ...state,
    testcases: updatedTestcases,
  }
}

/**
 * Validate Schema Node - Individual DML Execution & Result Mapping
 * Executes DDL first, then DML operations individually to associate results with use cases
 */
export async function validateSchemaNode(
  state: QaAgentState,
  config: RunnableConfig,
): Promise<QaAgentState> {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    throw new WorkflowTerminationError(
      configurableResult.error,
      'validateSchemaNode',
    )
  }
  const { repositories } = configurableResult.value

  const ddlStatements = generateDdlFromSchema(state.schemaData)
  const requiredExtensions = Object.keys(state.schemaData.extensions).sort()
  const hasDdl = ddlStatements?.trim()
  const hasTestcases = state.testcases.length > 0
  const hasDml = hasTestcases

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
    const ddlResults: SqlResult[] = await executeQuery(
      ddlStatements,
      requiredExtensions,
    )
    allResults = [...ddlResults]
  }

  let testcaseExecutionResults: TestcaseDmlExecutionResult[] = []
  let updatedState = state
  if (hasDml) {
    testcaseExecutionResults = await executeDmlOperationsByTestcase(
      ddlStatements || '',
      state.testcases,
      requiredExtensions,
    )

    const dmlSqlResults: SqlResult[] = testcaseExecutionResults.map(
      (result) => ({
        sql: `Test Case: ${result.testCaseTitle}`,
        result: result.success
          ? { executed: true }
          : { error: result.failedOperation?.error },
        success: result.success,
        id: `testcase-${result.testCaseId}`,
        metadata: {
          executionTime: 0,
          timestamp: result.executedAt.toISOString(),
        },
      }),
    )
    allResults = [...allResults, ...dmlSqlResults]

    updatedState = updateWorkflowStateWithTestcaseResults(
      state,
      testcaseExecutionResults,
    )

    const workflowStateForArtifact = {
      ...updatedState,
      userInput: '', // Required by WorkflowState but not used by transformWorkflowStateToArtifact
      organizationId: '', // Required by WorkflowState but not used by transformWorkflowStateToArtifact
      userId: '', // Required by WorkflowState but not used by transformWorkflowStateToArtifact
    }
    const artifact = transformWorkflowStateToArtifact(workflowStateForArtifact)
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

    const validationMessage = formatValidationErrors(testcaseExecutionResults)

    const validationAIMessage = new AIMessage({
      content: validationMessage,
      name: 'SchemaValidator',
    })

    updatedState = {
      ...updatedState,
      messages: [...state.messages, validationAIMessage],
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
