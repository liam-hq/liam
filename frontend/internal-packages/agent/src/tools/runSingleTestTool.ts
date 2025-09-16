import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import type { Testcase } from '../qa-agent/types'
import { SSE_EVENTS } from '../streaming/constants'
import { WorkflowTerminationError } from '../utils/errorHandling'
import { executeTestcase } from '../utils/executeTestcase'
import { getToolConfigurable } from './getToolConfigurable'

const toolSchema = v.object({
  testcaseId: v.optional(v.string()),
})

export const runSingleTestTool: StructuredTool = tool(
  async (input, config: RunnableConfig): Promise<Command> => {
    const parsedInput = v.parse(toolSchema, input)
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        'runSingleTestTool',
      )
    }

    const { testcases, ddlStatements, requiredExtensions, toolCallId } =
      toolConfigurableResult.value

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

    // Select testcase - use specific ID if provided, otherwise use first testcase
    const targetTestcase = parsedInput.testcaseId
      ? testcases.find((tc) => tc.id === parsedInput.testcaseId)
      : testcases[0]

    if (!targetTestcase) {
      const errorMsg = parsedInput.testcaseId
        ? `Test case with ID "${parsedInput.testcaseId}" not found.`
        : 'No test case available to execute.'

      const toolMessage = new ToolMessage({
        id: uuidv4(),
        content: errorMsg,
        tool_call_id: toolCallId,
      })
      await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

      return new Command({
        update: {
          messages: [toolMessage],
        },
      })
    }

    // Execute single test case
    const testResult = await executeTestcase(
      ddlStatements,
      targetTestcase,
      requiredExtensions,
    )

    // Update testcase with execution result
    const executionLog = {
      executed_at: testResult.executedAt.toISOString(),
      success: testResult.success,
      result_summary: testResult.success
        ? `Test Case "${testResult.testCaseTitle}" completed successfully`
        : `Test Case "${testResult.testCaseTitle}" failed: ${testResult.failedOperation?.error ?? 'Unknown error'}`,
    }

    const updatedDmlOperation = {
      ...targetTestcase.dmlOperation,
      dml_execution_logs: [executionLog],
    }

    const updatedTestcase: Testcase = {
      ...targetTestcase,
      dmlOperation: updatedDmlOperation,
    }

    // Update testcases array
    const updatedTestcases = testcases.map((tc) =>
      tc.id === targetTestcase.id ? updatedTestcase : tc,
    )

    // Create tool success message
    const summary = testResult.success
      ? `Test case "${testResult.testCaseTitle}" passed successfully`
      : `Test case "${testResult.testCaseTitle}" failed: ${testResult.failedOperation?.error ?? 'Unknown error'}`

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
    name: 'runSingleTestTool',
    description:
      'Execute a single test case with its DML operation to validate database schema. Runs DDL setup followed by single test case execution.',
    schema: toolSchema,
  },
)
