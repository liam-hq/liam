import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import type { DmlOperation } from '@liam-hq/artifact'
import pLimit from 'p-limit'
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
 * Executes with p-limit semaphore (max 3 parallel) using PGlite instance pool
 */
async function executeDmlOperationsByTestcase(
  ddlStatements: string,
  testcases: Testcase[],
  requiredExtensions: string[],
): Promise<TestcaseDmlExecutionResult[]> {
  // Log initial memory usage
  const initialMemory = process.memoryUsage()
  console.info('[runTestTool] Initial memory usage:', {
    rss: `${Math.round(initialMemory.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(initialMemory.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(initialMemory.heapTotal / 1024 / 1024)} MB`,
    external: `${Math.round(initialMemory.external / 1024 / 1024)} MB`,
    testcaseCount: testcases.length,
  })

  // Create semaphore limiter with max 3 concurrent executions
  // This matches the PGlite instance pool size
  const limit = pLimit(3)

  console.info(
    '[runTestTool] Starting parallel execution with max 3 concurrent testcases',
  )
  const startTime = Date.now()

  // Execute testcases in parallel with semaphore limiting
  const results = await Promise.all(
    testcases.map((testcase, i) => {
      if (!testcase) {
        // Return a dummy result for undefined testcases
        const dummyResult: TestcaseDmlExecutionResult = {
          testCaseId: '',
          testCaseTitle: 'Undefined',
          success: false,
          executedAt: new Date(),
          failedOperation: {
            sql: '',
            error: 'Testcase is undefined',
          },
        }
        return Promise.resolve(dummyResult)
      }

      return limit(async () => {
        console.info(
          `[runTestTool] Starting testcase ${i + 1}/${testcases.length}: ${testcase.id}`,
        )
        const testStartTime = Date.now()

        const result = await executeTestcase(
          ddlStatements,
          testcase,
          requiredExtensions,
        )

        const executionTime = Date.now() - testStartTime
        console.info(
          `[runTestTool] Completed testcase ${i + 1} in ${executionTime}ms`,
        )

        // Log warning if execution took too long
        if (executionTime > 10000) {
          console.warn(
            `[runTestTool] SLOW: Testcase ${testcase.id} took ${executionTime}ms`,
          )
        }

        // Log memory usage periodically (every 5 testcases)
        if ((i + 1) % 5 === 0) {
          const currentMemory = process.memoryUsage()
          console.info(
            `[runTestTool] Memory after ${i + 1}/${testcases.length} testcases:`,
            {
              rss: `${Math.round(currentMemory.rss / 1024 / 1024)} MB`,
              heapUsed: `${Math.round(currentMemory.heapUsed / 1024 / 1024)} MB`,
              external: `${Math.round(currentMemory.external / 1024 / 1024)} MB`,
              rssDelta: `+${Math.round((currentMemory.rss - initialMemory.rss) / 1024 / 1024)} MB`,
            },
          )
        }

        return result
      })
    }),
  )

  const totalTime = Date.now() - startTime
  console.info(
    `[runTestTool] Completed all ${testcases.length} testcases in ${totalTime}ms (${Math.round(totalTime / 1000)}s)`,
  )

  // Log final memory usage
  const finalMemory = process.memoryUsage()
  console.info('[runTestTool] Final memory usage:', {
    rss: `${Math.round(finalMemory.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(finalMemory.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(finalMemory.external / 1024 / 1024)} MB`,
    totalRssDelta: `+${Math.round((finalMemory.rss - initialMemory.rss) / 1024 / 1024)} MB`,
  })

  // Filter out dummy results from undefined testcases
  return results.filter((r) => r.testCaseId !== '')
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
