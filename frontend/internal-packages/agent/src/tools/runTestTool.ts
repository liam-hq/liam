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
import { classifyTestFailure } from '../utils/classifyError'
import { WorkflowTerminationError } from '../utils/errorHandling'
import { parseTapOutput } from '../utils/tapParser'
import { getToolConfigurable } from './getToolConfigurable'

/**
 * Extract TAP output from SQL query results
 *
 * pgTAP functions return TAP-formatted strings in their result rows.
 * This function extracts and combines them into a complete TAP output.
 */
const extractTapOutput = (sqlResults: Awaited<ReturnType<typeof executeQuery>>): string => {
  const tapLines: string[] = []

  for (const result of sqlResults) {
    if (!result.success) continue

    // Handle different result formats
    if (typeof result.result === 'string') {
      tapLines.push(result.result)
    } else if (
      result.result &&
      typeof result.result === 'object' &&
      'rows' in result.result
    ) {
      const rows = (result.result as { rows: unknown[] }).rows
      for (const row of rows) {
        if (row && typeof row === 'object') {
          // Extract all string values from the row object
          for (const value of Object.values(row)) {
            if (typeof value === 'string' && value.trim()) {
              tapLines.push(value)
            }
          }
        }
      }
    }
  }

  return tapLines.join('\n')
}

/**
 * Execute pgTAP test with automatic transaction wrapping
 *
 * Wraps the test SQL in BEGIN/ROLLBACK to ensure test isolation
 * and prevent database state pollution.
 */
const executePgTapTest = async (
  ddlStatements: string,
  testSql: string,
  requiredExtensions: string[],
) => {
  const startTime = new Date()

  // Ensure pgtap extension is in required extensions
  const extensions = requiredExtensions.includes('pgtap')
    ? requiredExtensions
    : [...requiredExtensions, 'pgtap']

  try {
    // Build complete SQL with DDL and test
    const sqlParts: string[] = []

    // Add DDL statements if provided
    if (ddlStatements.trim()) {
      sqlParts.push(ddlStatements)
    }

    // Enable pgTAP extension
    sqlParts.push('CREATE EXTENSION IF NOT EXISTS pgtap;')
    // Wrap test SQL in transaction
    sqlParts.push('BEGIN;')
    sqlParts.push(testSql)
    sqlParts.push('ROLLBACK;')

    const combinedSql = sqlParts.join('\n')

    // Execute the combined SQL
    const sqlResults = await executeQuery(combinedSql, extensions)

    // Extract TAP output from results
    const tapOutput = extractTapOutput(sqlResults)

    // Check for execution errors
    const firstFailed = sqlResults.find((r) => !r.success)
    if (firstFailed) {
      const isErrorResult = (value: unknown): value is { error: unknown } =>
        typeof value === 'object' && value !== null && 'error' in value

      const errorMessage = isErrorResult(firstFailed.result)
        ? String(firstFailed.result.error)
        : String(firstFailed.result)

      // Classify the error
      const errorClassification = classifyTestFailure(errorMessage)

      return {
        executedAt: startTime.toISOString(),
        success: false as const,
        message: errorMessage,
        tapOutput,
        errorCategory: errorClassification.category,
        errorCode: errorClassification.errorCode,
      }
    }

    // Parse TAP output
    const tapSummary = parseTapOutput(tapOutput)

    // Determine overall success based on TAP results
    const allTestsPassed = tapSummary.failed === 0

    if (!allTestsPassed) {
      // Extract error messages from failed tests
      const failedTests = tapSummary.tests.filter((t) => !t.ok)
      const errorMessages = failedTests
        .map((t) => {
          const diagnostics = t.diagnostics
            ? JSON.stringify(t.diagnostics)
            : ''
          return `Test ${t.testNumber}: ${t.description}${diagnostics ? `\n  ${diagnostics}` : ''}`
        })
        .join('\n')

      return {
        executedAt: startTime.toISOString(),
        success: false as const,
        message: `${tapSummary.failed} test(s) failed:\n${errorMessages}`,
        tapOutput,
        tapSummary,
      }
    }

    return {
      executedAt: startTime.toISOString(),
      success: true as const,
      message: `All ${tapSummary.passed} test(s) passed`,
      tapOutput,
      tapSummary,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorClassification = classifyTestFailure(errorMessage)

    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message: errorMessage,
      errorCategory: errorClassification.category,
      errorCode: errorClassification.errorCode,
    }
  }
}

/**
 * Execute a single testcase with DDL statements
 *
 * This function now uses pgTAP for test execution,
 * automatically wrapping tests in transactions for isolation.
 */
const executeTestCase = async (
  ddlStatements: string,
  testcase: TestCase,
  requiredExtensions: string[],
) => {
  // Use pgTAP test execution
  return await executePgTapTest(
    ddlStatements,
    testcase.sql,
    requiredExtensions,
  )
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
