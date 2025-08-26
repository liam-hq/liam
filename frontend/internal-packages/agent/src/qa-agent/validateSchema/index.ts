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
import type { Testcase } from '../generateTestcase/agent'

type TestcaseDmlExecutionResult = {
  testCaseId: string
  testCaseTitle: string
  success: boolean
  executedOperations: number
  errors?: string[]
  executedAt: Date
}

/**
 * Execute DML operations by testcase with DDL statements
 * Combines DDL and testcase-specific DML into single execution units
 */
async function executeDmlOperationsByTestcase(
  ddlStatements: string,
  testcases: Testcase[],
): Promise<TestcaseDmlExecutionResult[]> {
  const results: TestcaseDmlExecutionResult[] = []

  for (const testcase of testcases) {
    if (!testcase.dmlOperations || testcase.dmlOperations.length === 0) {
      continue
    }

    const sqlParts = []

    if (ddlStatements.trim()) {
      sqlParts.push('-- DDL Statements', ddlStatements, '')
    }

    sqlParts.push(
      `-- Test Case: ${testcase.id}`,
      `-- ${testcase.title}`,
      ...testcase.dmlOperations.map((op) => {
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
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
        success: !hasErrors,
        executedOperations: testcase.dmlOperations.length,
        ...(hasErrors && { errors }),
        executedAt: startTime,
      })
    } else {
      results.push({
        testCaseId: testcase.id,
        testCaseTitle: testcase.title,
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
 * Update workflow state with testcase-based execution results
 */
function updateWorkflowStateWithTestcaseResults(
  state: WorkflowState,
  results: TestcaseDmlExecutionResult[],
): WorkflowState {
  if (!state.generatedTestcases) {
    return state
  }

  const resultMap = new Map(
    results.map((result) => [result.testCaseId, result]),
  )

  const updatedTestcases = state.generatedTestcases.map((testcase) => {
    const testcaseResult = resultMap.get(testcase.id)

    if (!testcaseResult || !testcase.dmlOperations) {
      return testcase
    }

    const updatedDmlOperations = testcase.dmlOperations.map((dmlOp) => {
      const executionLog = {
        executed_at: testcaseResult.executedAt.toISOString(),
        success: testcaseResult.success,
        result_summary: testcaseResult.success
          ? `Test Case "${testcaseResult.testCaseTitle}" operations completed successfully`
          : `Test Case "${testcaseResult.testCaseTitle}" failed: ${testcaseResult.errors?.join('; ')}`,
      }

      return {
        ...dmlOp,
        dml_execution_logs: [executionLog],
      }
    })

    return {
      ...testcase,
      dmlOperations: updatedDmlOperations,
    }
  })

  return {
    ...state,
    generatedTestcases: updatedTestcases,
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
  const hasTestcases =
    state.generatedTestcases && state.generatedTestcases.length > 0
  const hasDml =
    hasTestcases &&
    state.generatedTestcases?.some(
      (tc) => tc.dmlOperations && tc.dmlOperations.length > 0,
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

  let testcaseExecutionResults: TestcaseDmlExecutionResult[] = []
  let updatedState = state
  if (hasDml && state.generatedTestcases) {
    testcaseExecutionResults = await executeDmlOperationsByTestcase(
      ddlStatements || '',
      state.generatedTestcases,
    )

    const dmlSqlResults: SqlResult[] = testcaseExecutionResults.map(
      (result) => ({
        sql: `Test Case: ${result.testCaseTitle}`,
        result: result.success
          ? { executedOperations: result.executedOperations }
          : { errors: result.errors },
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

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.length - successCount

    let validationMessage: string
    if (errorCount === 0) {
      validationMessage =
        'Database validation complete: all checks passed successfully'
    } else {
      const errorDetails = testcaseExecutionResults
        .filter((result) => !result.success)
        .map((result) => {
          const errorMessages = result.errors?.join('\n  - ') || 'Unknown error'
          return `- "${result.testCaseTitle}":\n  - ${errorMessages}`
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
