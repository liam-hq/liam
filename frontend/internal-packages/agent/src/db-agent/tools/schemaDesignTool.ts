import type { RunnableConfig } from '@langchain/core/runnables'
import { tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import {
  applyPatchOperations,
  operationsSchema,
  postgresqlSchemaDeparser,
  type Schema,
} from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { Operation } from 'fast-json-patch'
import { fromThrowable } from 'neverthrow'
import * as v from 'valibot'
import { getToolConfigurable } from '../getToolConfigurable'

const schemaDesignToolSchema = v.object({
  operations: operationsSchema,
})

// toJsonSchema returns a JSONSchema7, which is not assignable to JSONSchema
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(schemaDesignToolSchema) as JSONSchema

const applySchemaOperations = (
  schema: Schema,
  operations: Operation[],
): void => {
  const applyOperationsResult = fromThrowable(
    () => applyPatchOperations(schema, operations),
    (error) => (error instanceof Error ? error.message : 'Unknown error'),
  )()

  if (applyOperationsResult.isErr()) {
    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error(
      `Failed to apply schema operations: ${applyOperationsResult.error}. Please check the operations format and try again.`,
    )
  }
}

const validateAndExecuteDDL = async (
  schema: Schema,
  designSessionId: string,
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

  // Execute DDL to validate it
  const results: SqlResult[] = await executeQuery(
    designSessionId,
    ddlStatements,
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

  return { ddlStatements, results }
}

export const schemaDesignTool = tool(
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

    // Get current schema to validate DDL before creating version
    const schemaResult = await repositories.schema.getSchema(designSessionId)
    if (schemaResult.isErr()) {
      // LangGraph tool nodes require throwing errors to trigger retry mechanism
      // eslint-disable-next-line no-throw-error/no-throw-error
      throw new Error(
        'Could not retrieve current schema for DDL validation. Please check the schema ID and try again.',
      )
    }

    // Apply operations to current schema to get the updated schema
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const currentSchema = structuredClone(schemaResult.value.schema) as Schema
    applySchemaOperations(currentSchema, parsed.output.operations)

    // Validate DDL by generating and executing it
    const { ddlStatements, results } = await validateAndExecuteDDL(
      currentSchema,
      designSessionId,
    )

    // Log the validation query and results
    const queryResult = await repositories.schema.createValidationQuery({
      designSessionId,
      queryString: ddlStatements,
    })

    if (queryResult.success) {
      await repositories.schema.createValidationResults({
        validationQueryId: queryResult.queryId,
        results,
      })

      // Log successful DDL execution to timeline
      const successfulStatements = results.filter(
        (result) => result.success,
      ).length
      const totalStatements = results.length
      const summary = `DDL validation successful: ${successfulStatements}/${totalStatements} statements executed successfully`

      // Create timeline item for DDL execution results
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

    // After DDL validation passes, create the actual version
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

    return 'Schema successfully updated. The operations have been applied to the database schema, DDL validation passed, and new version created.'
  },
  {
    name: 'schemaDesignTool',
    description:
      'Use to design database schemas, recommend table structures, and help with database modeling. This tool applies JSON Patch operations to modify schema elements including tables, columns, indexes, and constraints. When operations fail, the tool provides detailed error messages with specific guidance for correction. Always include all required schema properties (columns, constraints, indexes) when creating tables.',
    schema: toolSchema,
  },
)
