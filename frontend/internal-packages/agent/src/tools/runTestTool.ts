import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { executeQuery } from '@liam-hq/pglite-server'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { formatValidationErrors } from '../qa-agent/validateSchema/formatValidationErrors'
import type {
  AnalyzedRequirements,
  TestCase,
} from '../schemas/analyzedRequirements'
import { SSE_EVENTS } from '../streaming/constants'
import { WorkflowTerminationError } from '../utils/errorHandling'
import { getToolConfigurable } from './getToolConfigurable'

/**
 * Build combined SQL for DDL and testcase
 */
const buildCombinedSql = (
  ddlStatements: string,
  testcase: TestCase,
): string => {
  const sqlParts = []

  if (ddlStatements.trim()) {
    sqlParts.push('-- DDL Statements', ddlStatements, '')
  }

  sqlParts.push(
    `-- Test Case: ${testcase.id}`,
    `-- ${testcase.title}`,
    `-- ${testcase.type} operation\n${testcase.sql};`,
  )

  return sqlParts.filter(Boolean).join('\n')
}

/**
 * Execute a single testcase with DDL statements
 */
const executeTestCase = async (
  ddlStatements: string,
  testcase: TestCase,
  requiredExtensions: string[],
) => {
  const combinedSql = buildCombinedSql(ddlStatements, testcase)
  const startTime = new Date()

  const sqlResults = await executeQuery(combinedSql, requiredExtensions)
  const firstFailed = sqlResults.find((r) => !r.success)

  if (firstFailed) {
    const isErrorResult = (value: unknown): value is { error: unknown } =>
      typeof value === 'object' && value !== null && 'error' in value

    const error = isErrorResult(firstFailed.result)
      ? String(firstFailed.result.error)
      : String(firstFailed.result)

    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message: error,
    }
  }

  return {
    executedAt: startTime.toISOString(),
    success: true as const,
    message: 'Operations completed successfully',
  }
}

/**
 * Execute all test cases and update analyzedRequirements with results
 */
const executeTestCases = async (
  ddlStatements: string,
  analyzedRequirements: AnalyzedRequirements,
  requiredExtensions: string[],
): Promise<AnalyzedRequirements> => {
  const updatedTestcases: Record<string, TestCase[]> = {}

  for (const [category, testcases] of Object.entries(
    analyzedRequirements.testcases,
  )) {
    updatedTestcases[category] = await Promise.all(
      testcases.map(async (testcase) => {
        const testResult = await executeTestCase(
          ddlStatements,
          testcase,
          requiredExtensions,
        )

        return {
          ...testcase,
          testResults: [...testcase.testResults, testResult],
        }
      }),
    )
  }

  return {
    ...analyzedRequirements,
    testcases: updatedTestcases,
  }
}

const toolSchema = v.object({})

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
      ddlStatements,
      requiredExtensions,
      analyzedRequirements,
      toolCallId,
    } = toolConfigurableResult.value

    const totalTests = Object.values(analyzedRequirements.testcases).reduce(
      (count, testcases) => count + testcases.length,
      0,
    )

    if (totalTests === 0) {
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

    // Execute all test cases and update analyzedRequirements with results
    // (continue on failure - standard test framework behavior)
    const updatedAnalyzedRequirements = await executeTestCases(
      ddlStatements,
      analyzedRequirements,
      requiredExtensions,
    )

    // Count passed and failed tests from testResults
    let passedTests = 0
    let failedTests = 0
    for (const testcases of Object.values(
      updatedAnalyzedRequirements.testcases,
    )) {
      for (const testcase of testcases) {
        const latestResult =
          testcase.testResults[testcase.testResults.length - 1]
        if (latestResult) {
          if (latestResult.success) {
            passedTests++
          } else {
            failedTests++
          }
        }
      }
    }

    // Generate validation message
    const validationMessage = formatValidationErrors(
      updatedAnalyzedRequirements,
    )

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
    await dispatchCustomEvent(
      SSE_EVENTS.ANALYZED_REQUIREMENTS,
      updatedAnalyzedRequirements,
    )

    const updateData = {
      analyzedRequirements: updatedAnalyzedRequirements,
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
