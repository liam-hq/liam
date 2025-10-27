import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { fromPromise } from '@liam-hq/neverthrow'
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
import { parseTapOutput } from '../utils/tapParser'
import { getToolConfigurable } from './getToolConfigurable'

const isResultWithRows = (value: unknown): value is { rows: unknown[] } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rows' in value &&
    Array.isArray(value.rows)
  )
}

const extractStringsFromRow = (row: unknown): string[] => {
  if (!row || typeof row !== 'object') return []

  const strings: string[] = []
  for (const value of Object.values(row)) {
    if (typeof value === 'string' && value.trim()) {
      strings.push(value)
    }
  }
  return strings
}

const processResult = (result: {
  success: boolean
  result: unknown
}): string[] => {
  if (!result.success) return []

  if (typeof result.result === 'string') {
    return [result.result]
  }

  if (isResultWithRows(result.result)) {
    const tapLines: string[] = []
    for (const row of result.result.rows) {
      tapLines.push(...extractStringsFromRow(row))
    }
    return tapLines
  }

  return []
}

const formatDiagnostics = (
  diagnostics: Record<string, unknown> | undefined,
): string => {
  if (!diagnostics) return ''

  const comments = diagnostics['comments']
  if (Array.isArray(comments) && comments.length > 0) {
    // Limiting to first 3 lines to prevent overly long logs.
    const maxLines = 3
    const relevantComments = comments.slice(0, maxLines)
    return relevantComments.map((comment) => `  ${comment}`).join('\n')
  }

  const entries = Object.entries(diagnostics)
  if (entries.length > 0) {
    return entries
      .slice(0, 3)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n')
  }

  return ''
}

const extractTapOutput = (
  sqlResults: Awaited<ReturnType<typeof executeQuery>>,
): string => {
  const tapLines: string[] = []

  for (const result of sqlResults) {
    tapLines.push(...processResult(result))
  }

  return tapLines.join('\n')
}

const executeTestCase = async (
  ddlStatements: string,
  testcase: TestCase,
  requiredExtensions: string[],
) => {
  const startTime = new Date()

  const extensions = requiredExtensions.includes('pgtap')
    ? requiredExtensions
    : [...requiredExtensions, 'pgtap']

  const sqlParts: string[] = []

  if (ddlStatements.trim()) {
    sqlParts.push(ddlStatements)
  }

  sqlParts.push('CREATE EXTENSION IF NOT EXISTS pgtap;')
  sqlParts.push(testcase.sql)

  const combinedSql = sqlParts.join('\n')

  const sqlResult = await fromPromise(executeQuery(combinedSql, extensions))

  if (sqlResult.isErr()) {
    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message: sqlResult.error.message,
    }
  }

  const sqlResults = sqlResult.value
  const firstFailed = sqlResults.find((r) => !r.success)
  if (firstFailed) {
    const isErrorResult = (value: unknown): value is { error: unknown } =>
      typeof value === 'object' && value !== null && 'error' in value

    const errorMessage = isErrorResult(firstFailed.result)
      ? String(firstFailed.result.error)
      : String(firstFailed.result)

    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message: errorMessage,
    }
  }

  const tapOutput = extractTapOutput(sqlResults)
  const tapSummary = parseTapOutput(tapOutput)

  // Guard against empty/malformed TAP
  if (tapSummary.plan === null || tapSummary.total === 0) {
    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message:
        'No TAP output or missing plan detected. Ensure your pgTAP test runs plan(...) and SELECT * FROM finish().',
    }
  }

  // Check for plan mismatch but treat as warning only
  const warnings: string[] = []
  if (
    tapSummary.plan !== null &&
    tapSummary.total !== tapSummary.plan.end - tapSummary.plan.start + 1
  ) {
    warnings.push(
      `Warning: TAP plan mismatch - planned ${tapSummary.plan.end - tapSummary.plan.start + 1} test(s), but got ${tapSummary.total}.`,
    )
  }

  const allTestsPassed = tapSummary.failed === 0

  if (!allTestsPassed) {
    const failedTests = tapSummary.tests.filter((t) => !t.ok)
    const errorMessages = failedTests
      .map((t) => {
        const diagnostics = formatDiagnostics(t.diagnostics)
        return `Test ${t.testNumber}: ${t.description}${diagnostics ? `\n${diagnostics}` : ''}`
      })
      .join('\n')

    const warningPrefix =
      warnings.length > 0 ? `${warnings.join('\n')}\n\n` : ''
    return {
      executedAt: startTime.toISOString(),
      success: false as const,
      message: `${warningPrefix}${tapSummary.failed} test(s) failed:\n${errorMessages}`,
    }
  }

  const warningPrefix = warnings.length > 0 ? `${warnings.join('\n')}\n` : ''
  return {
    executedAt: startTime.toISOString(),
    success: true as const,
    message: `${warningPrefix}All ${tapSummary.passed} test(s) passed`,
  }
}

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

    const updatedAnalyzedRequirements = await executeTestCases(
      ddlStatements,
      analyzedRequirements,
      requiredExtensions,
    )

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
