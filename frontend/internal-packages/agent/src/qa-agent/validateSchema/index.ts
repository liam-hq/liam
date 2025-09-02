import { AIMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { generateDdlFromSchema } from '../../chat/workflow/utils/generateDdl'
import { transformWorkflowStateToArtifact } from '../../chat/workflow/utils/transformWorkflowStateToArtifact'
import { withTimelineItemSync } from '../../chat/workflow/utils/withTimelineItemSync'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { Testcase } from '../types'
import { formatValidationErrors } from './formatValidationErrors'
import type { TestcaseDmlExecutionResult } from './types'

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
    if (!testcase.dmlOperation) {
      continue
    }

    const sqlParts = []

    if (ddlStatements.trim()) {
      sqlParts.push('-- DDL Statements', ddlStatements, '')
    }

    const op = testcase.dmlOperation
    const header = op.description
      ? `-- ${op.description}`
      : `-- ${op.operation_type} operation`
    sqlParts.push(
      `-- Test Case: ${testcase.id}`,
      `-- ${testcase.title}`,
      `${header}\n${op.sql};`,
    )

    const combinedSql = sqlParts.filter(Boolean).join('\n')

    const startTime = new Date()
    const executionResult = await ResultAsync.fromPromise(
      executeQuery(combinedSql, requiredExtensions),
      (error) => new Error(String(error)),
    )

    if (executionResult.isOk()) {
      const sqlResults = executionResult.value

      const hasErrors = sqlResults.some((result) => !result.success)

      if (hasErrors) {
        const failedResult = sqlResults.find((result) => !result.success)
        let error = 'Unknown error'
        if (
          typeof failedResult?.result === 'object' &&
          failedResult?.result !== null &&
          'error' in failedResult.result
        ) {
          error = String(failedResult.result.error)
        } else {
          error = String(failedResult?.result)
        }

        results.push({
          testCaseId: testcase.id,
          testCaseTitle: testcase.title,
          success: false,
          error,
          failedSql: failedResult?.sql || testcase.dmlOperation.sql,
          executedAt: startTime,
        })
      } else {
        results.push({
          testCaseId: testcase.id,
          testCaseTitle: testcase.title,
          success: true,
          executedAt: startTime,
        })
      }
    } else {
      results.push({
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
        success: false,
        error: executionResult.error.message,
        failedSql: testcase.dmlOperation.sql,
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
  state: WorkflowState,
  results: TestcaseDmlExecutionResult[],
): WorkflowState {
  if (!state.testcases) {
    return state
  }

  const resultMap = new Map(
    results.map((result) => [result.testCaseId, result]),
  )

  const updatedTestcases = state.testcases.map((testcase) => {
    const testcaseResult = resultMap.get(testcase.id)

    if (!testcaseResult || !testcase.dmlOperation) {
      return testcase
    }

    const executionLog = {
      executed_at: testcaseResult.executedAt.toISOString(),
      success: testcaseResult.success,
      result_summary: testcaseResult.success
        ? `Test Case "${testcaseResult.testCaseTitle}" operation completed successfully`
        : `Test Case "${testcaseResult.testCaseTitle}" failed: ${testcaseResult.error}`,
    }

    const updatedDmlOperation = {
      ...testcase.dmlOperation,
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
  const requiredExtensions = Object.keys(state.schemaData.extensions).sort()
  const hasDdl = ddlStatements?.trim()
  const hasTestcases = state.testcases && state.testcases.length > 0
  const hasDml = hasTestcases && state.testcases?.some((tc) => tc.dmlOperation)

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
  if (hasDml && state.testcases) {
    testcaseExecutionResults = await executeDmlOperationsByTestcase(
      ddlStatements || '',
      state.testcases,
      requiredExtensions,
    )

    const dmlSqlResults: SqlResult[] = testcaseExecutionResults.map(
      (result) => ({
        sql: `Test Case: ${result.testCaseTitle}`,
        result: result.success
          ? { status: 'success' }
          : { error: result.error },
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

    const validationMessage = formatValidationErrors(testcaseExecutionResults)

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
