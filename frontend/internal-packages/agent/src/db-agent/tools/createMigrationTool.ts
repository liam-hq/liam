import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import {
  applyPatchOperations,
  migrationOperationsSchema,
  postgresqlSchemaDeparser,
  type Schema,
} from '@liam-hq/schema'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../client'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'
import { withSentryCaptureException } from '../../utils/withSentryCaptureException'
import { getToolConfigurable } from '../getToolConfigurable'

const TOOL_NAME = 'createMigrationTool'

const createMigrationToolSchema = v.object({
  operations: migrationOperationsSchema,
})

const toolSchema = toJsonSchema(createMigrationToolSchema)

const validateAndExecuteDDL = async (
  schema: Schema,
): Promise<{ results: SqlResult[] }> => {
  // Validate DDL by generating and executing it
  const ddlResult = postgresqlSchemaDeparser(schema)

  if (ddlResult.errors.length > 0) {
    const errorDetails = ddlResult.errors
      .map((error) => error.message)
      .join('; ')
    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error(
      `DDL generation failed due to schema errors: ${errorDetails}. The schema design contains issues that prevent valid SQL generation. Please review and fix the schema structure.`,
    )
  }

  const ddlStatements = ddlResult.value
  const requiredExtensions = Object.keys(schema.extensions).sort()

  // Execute DDL to validate it
  const results: SqlResult[] = await executeQuery(
    ddlStatements,
    requiredExtensions,
  )

  const hasExecutionErrors = results.some(
    (result: SqlResult) => !result.success,
  )

  if (hasExecutionErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error(
      `DDL execution validation failed: ${errorMessages}. The schema design produces invalid SQL. Please review the schema structure and fix the errors.`,
    )
  }

  return { results }
}

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
})
const getConfigData = (config: RunnableConfig): { toolCallId: string } => {
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    throw new WorkflowTerminationError(
      new Error('Tool call ID not found in config'),
      TOOL_NAME,
    )
  }
  return {
    toolCallId: configParseResult.output.toolCall.id,
  }
}

const sendToolMessage = async (
  toolCallId: string,
  status: 'success' | 'error',
  content: string,
) => {
  const toolMessage = new ToolMessage({
    id: uuidv4(),
    name: TOOL_NAME,
    status,
    content,
    tool_call_id: toolCallId,
  })
  await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
  return toolMessage
}

export const createMigrationTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<string> => {
    return withSentryCaptureException(async () => {
      const { toolCallId } = getConfigData(config)

      const toolConfigurableResult = getToolConfigurable(config)
      if (toolConfigurableResult.isErr()) {
        const errorMessage = `Configuration error: ${toolConfigurableResult.error.message}. Please check the tool configuration and try again.`
        await sendToolMessage(toolCallId, 'error', errorMessage)

        return errorMessage
      }
      const { repositories, designSessionId } = toolConfigurableResult.value
      const parsed = v.safeParse(createMigrationToolSchema, input)
      if (!parsed.success) {
        const errorDetails = parsed.issues
          .map((issue) => `${issue.path?.join('.')}: ${issue.message}`)
          .join(', ')
        const errorMessage = `Input validation failed: ${errorDetails}. Please check your operations format and ensure all required fields are provided correctly.`
        await sendToolMessage(toolCallId, 'error', errorMessage)

        return errorMessage
      }

      const schemaResult = await repositories.schema.getSchema(designSessionId)
      if (schemaResult.isErr()) {
        const errorMessage =
          'Could not retrieve current schema for DDL validation. Please check the schema ID and try again.'
        await sendToolMessage(toolCallId, 'error', errorMessage)
        // LangGraph tool nodes require throwing errors to trigger retry mechanism
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(errorMessage)
      }

      const applyResult = applyPatchOperations(
        schemaResult.value.schema,
        parsed.output.operations,
      )

      if (applyResult.isErr()) {
        const errorMessage = `Failed to apply patch operations before DDL validation: ${applyResult.error.message}`
        await sendToolMessage(toolCallId, 'error', errorMessage)
        // LangGraph tool nodes require throwing errors to trigger retry mechanism
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(errorMessage)
      }

      const { results } = await validateAndExecuteDDL(applyResult.value)

      const successfulStatements = results.filter(
        (result) => result.success,
      ).length
      const totalStatements = results.length

      const versionResult = await repositories.schema.createVersion({
        buildingSchemaId: schemaResult.value.id,
        latestVersionNumber: schemaResult.value.latestVersionNumber,
        patch: parsed.output.operations,
      })

      if (!versionResult.success) {
        const errorContent = versionResult.error ?? 'Unknown error occurred'
        const errorMessage = `Failed to create schema version after DDL validation: ${errorContent}. Please try again.`
        await sendToolMessage(toolCallId, 'error', errorMessage)
        // LangGraph tool nodes require throwing errors to trigger retry mechanism
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(errorMessage)
      }

      const successMessage = `Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (${successfulStatements}/${totalStatements} statements executed successfully), and new version created.`
      await sendToolMessage(toolCallId, 'success', successMessage)

      return successMessage
    })
  },
  {
    name: TOOL_NAME,
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling. This tool applies JSON Patch operations to modify schema elements including tables, columns, indexes, constraints, and enums. When operations fail, the tool provides detailed error messages with specific guidance for correction. Always include all required schema properties (columns, constraints, indexes) when creating tables.',
    schema: toolSchema,
  },
)
