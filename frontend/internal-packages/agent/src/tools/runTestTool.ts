import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import type { DmlOperation } from '@liam-hq/artifact'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import type { Testcase } from '../qa-agent/types'
import { formatValidationErrors } from '../qa-agent/validateSchema/formatValidationErrors'
import type { TestcaseDmlExecutionResult } from '../qa-agent/validateSchema/types'
import { SSE_EVENTS } from '../streaming/constants'
import { WorkflowTerminationError } from '../utils/errorHandling'
import { executeTestcase } from '../utils/executeTestcase'
import { getToolConfigurable } from './getToolConfigurable'
import { transformStateToArtifact } from './transformStateToArtifact'

/**
 * Execute DML operations by testcase with DDL statements
 * Combines DDL and testcase-specific DML into single execution units
 */
async function executeDmlOperationsByTestcase(
  ddlStatements: string,
  testcases: Testcase[],
  requiredExtensions: string[],
): Promise<TestcaseDmlExecutionResult[]> {
  return Promise.all(
    testcases.map((testcase) =>
      executeTestcase(ddlStatements, testcase, requiredExtensions),
    ),
  )
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

    // Create tool success message
    const totalTests = testcaseExecutionResults.length
    const passedTests = testcaseExecutionResults.filter((r) => r.success).length
    const failedTests = totalTests - passedTests

    const summary =
      failedTests === 0
        ? `All ${totalTests} test cases passed successfully`
        : `${passedTests}/${totalTests} test cases passed, ${failedTests} failed\n\n${validationMessage}`

    const toolMessage = new ToolMessage({
      id: uuidv4(),
      content: summary,
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    const updateData = {
      testcases: updatedTestcases,
      messages: [toolMessage],
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
