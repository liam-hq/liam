import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessage, ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import type { DmlOperation } from '@liam-hq/artifact'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../client'
import type { Testcase } from '../qa-agent/types'
import { formatValidationErrors } from '../qa-agent/validateSchema/formatValidationErrors'
import type { TestcaseDmlExecutionResult } from '../qa-agent/validateSchema/types'
import { WorkflowTerminationError } from '../utils/errorHandling'
import { getToolConfigurable } from './getToolConfigurable'
import { transformStateToArtifact } from './transformStateToArtifact'

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

    const sqlResults = await executeQuery(combinedSql, requiredExtensions)
    const hasErrors = sqlResults.some((result) => !result.success)
    const failedOperation = hasErrors
      ? extractFailedOperation(sqlResults)
      : undefined

    const baseResult = {
      testCaseId: testcase.id,
      testCaseTitle: testcase.title,
      executedAt: startTime,
    }

    if (hasErrors && failedOperation) {
      results.push({
        ...baseResult,
        success: false,
        failedOperation,
      })
    } else {
      results.push({
        ...baseResult,
        success: true,
      })
    }
  }

  return results
}

const toolSchema = v.object({})

/**
 * Update workflow state with testcase-based execution results
 */
function updateWorkflowStateWithTestcaseResults(
  testcases: Testcase[],
  results: TestcaseDmlExecutionResult[],
): Testcase[] {
  const resultMap = new Map(
    results.map((result) => [result.testCaseId, result]),
  )

  return testcases.map((testcase) => {
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
}

export const runTestTool: StructuredTool = tool(
  async (_input: unknown, config: RunnableConfig): Promise<Command> => {
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        'runTestTool',
      )
    }

    const {
      repositories,
      testcases,
      ddlStatements,
      requiredExtensions,
      designSessionId,
      analyzedRequirements,
      toolCallId,
    } = toolConfigurableResult.value

    if (testcases.length === 0) {
      const toolMessage = new ToolMessage({
        id: uuidv4(),
        content: 'No test cases to execute.',
        tool_call_id: toolCallId,
      })
      await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

      return new Command({
        update: {
          messages: [toolMessage],
        },
      })
    }

    // Execute all test cases (continue on failure - standard test framework behavior)
    const testcaseExecutionResults = await executeDmlOperationsByTestcase(
      ddlStatements,
      testcases,
      requiredExtensions,
    )

    // Update testcases with execution results
    const updatedTestcases = updateWorkflowStateWithTestcaseResults(
      testcases,
      testcaseExecutionResults,
    )

    // Save artifact with updated test results
    const artifactState = {
      testcases: updatedTestcases,
      analyzedRequirements,
    }
    const artifact = transformStateToArtifact(artifactState)
    await repositories.schema.upsertArtifact({
      designSessionId,
      artifact,
    })

    // Convert test results to SQL results format for database storage
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

    // Save validation query and results to database
    const combinedStatements = [
      ddlStatements ? 'DDL Statements' : '',
      'DML operations executed individually',
    ]
      .filter(Boolean)
      .join('\n')

    const queryResult = await repositories.schema.createValidationQuery({
      designSessionId,
      queryString: combinedStatements,
    })

    if (queryResult.success) {
      await repositories.schema.createValidationResults({
        validationQueryId: queryResult.queryId,
        results: dmlSqlResults,
      })
    }

    // Generate validation message
    const validationMessage = formatValidationErrors(testcaseExecutionResults)
    const validationAIMessage = new AIMessage({
      content: validationMessage,
      name: 'SchemaValidator',
    })

    // Create tool success message
    const totalTests = testcaseExecutionResults.length
    const passedTests = testcaseExecutionResults.filter((r) => r.success).length
    const failedTests = totalTests - passedTests

    const summary =
      failedTests === 0
        ? `All ${totalTests} test cases passed successfully`
        : `${passedTests}/${totalTests} test cases passed, ${failedTests} failed`

    const toolMessage = new ToolMessage({
      id: uuidv4(),
      content: summary,
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    const updateData = {
      testcases: updatedTestcases,
      messages: [validationAIMessage, toolMessage],
    }

    return new Command({
      update: updateData,
    })
  },
  {
    name: 'runTestTool',
    description:
      'Execute all test cases with their DML operations to validate database schema. Runs DDL setup followed by individual test case execution, continuing on failures to provide complete test results.',
    schema: toolSchema,
  },
)
