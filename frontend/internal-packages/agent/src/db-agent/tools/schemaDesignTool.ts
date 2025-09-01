import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import {
  applyPatchOperations,
  operationsSchema,
  postgresqlSchemaDeparser,
  type Schema,
} from '@liam-hq/schema'
import * as v from 'valibot'
import { toJsonSchema } from '../../shared/jsonSchema'
import { getToolConfigurable } from '../getToolConfigurable'

const schemaDesignToolSchema = v.object({
  operations: operationsSchema,
})

const toolSchema = toJsonSchema(schemaDesignToolSchema)

const validateAndExecuteDDL = async (
  schema: Schema,
): Promise<{ ddlStatements: string; results: SqlResult[] }> => {
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
  const requiredExtensions = Object.keys(schema.extensions)

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

  return { results, ddlStatements }
}

export const schemaDesignTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<string> => {
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      return `Configuration error: ${toolConfigurableResult.error.message}. Please check the tool configuration and try again.`
    }
    const { repositories, buildingSchemaId, designSessionId } =
      toolConfigurableResult.value
    const parsed = v.safeParse(schemaDesignToolSchema, input)
    if (!parsed.success) {
      const errorDetails = parsed.issues
        .map((issue) => `${issue.path?.join('.')}: ${issue.message}`)
        .join(', ')
      return `Input validation failed: ${errorDetails}. Please check your operations format and ensure all required fields are provided correctly.`
    }

    const schemaResult = await repositories.schema.getSchema(designSessionId)
    if (schemaResult.isErr()) {
      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        'Could not retrieve current schema for DDL validation. Please check the schema ID and try again.',
      )
    }

    const applyResult = applyPatchOperations(
      schemaResult.value.schema,
      parsed.output.operations,
    )

    if (applyResult.isErr()) {
      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to apply patch operations before DDL validation: ${applyResult.error.message}`,
      )
    }

    const { ddlStatements, results } = await validateAndExecuteDDL(
      applyResult.value,
    )

    const queryResult = await repositories.schema.createValidationQuery({
      designSessionId,
      queryString: ddlStatements,
    })

    if (queryResult.success) {
      await repositories.schema.createValidationResults({
        validationQueryId: queryResult.queryId,
        results,
      })

      const successfulStatements = results.filter(
        (result) => result.success,
      ).length
      const totalStatements = results.length
      const summary = `DDL validation successful: ${successfulStatements}/${totalStatements} statements executed successfully`

      const result = await repositories.schema.createTimelineItem({
        designSessionId,
        content: summary,
        type: 'query_result',
        queryResultId: queryResult.queryId,
      })

      if (!result.success) {
        // LangGraph tool nodes require throwing errors to trigger retry mechanism
        // eslint-disable-next-line no-throw-error/no-throw-error
        throw new Error(
          `Failed to create timeline item for DDL execution results: ${result.error}. Please try again.`,
        )
      }
    }

    const versionResult = await repositories.schema.createVersion({
      buildingSchemaId,
      latestVersionNumber: schemaResult.value.latestVersionNumber,
      patch: parsed.output.operations,
    })

    if (!versionResult.success) {
      const errorMessage = versionResult.error ?? 'Unknown error occurred'
      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        `Failed to create schema version after DDL validation: ${errorMessage}. Please try again.`,
      )
    }

    const successfulStatements = results.filter(
      (result) => result.success,
    ).length
    const totalStatements = results.length

    return `Schema successfully updated. The operations have been applied to the database schema, DDL validation successful (${successfulStatements}/${totalStatements} statements executed successfully), and new version created.`
  },
  {
    name: 'schemaDesignTool',
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling. This tool applies JSON Patch operations to modify schema elements including tables, columns, indexes, constraints, and enums. When operations fail, the tool provides detailed error messages with specific guidance for correction. Always include all required schema properties (columns, constraints, indexes) when creating tables.',
    schema: toolSchema,
  },
)
